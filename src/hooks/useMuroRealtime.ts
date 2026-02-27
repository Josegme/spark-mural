/**
 * PICKEVENT - Hook para realtime del muro interactivo
 * Maneja suscripciones y carrusel de contenido
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/lib/constants';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface MuroContent {
  id: string;
  tipo: 'foto' | 'video' | 'mensaje';
  url_original: string | null;
  url_ia: string | null;
  mensaje_texto: string | null;
  invitado_nombre: string | null;
  likes_count: number;
  created_at: string;
  estado_ia: 'pendiente' | 'procesando' | 'completado' | 'error';
}

export interface MuroEvent {
  id: string;
  nombre: string;
  tipo: string;
  es_premium: boolean;
  tema_ia: string | null;
  estilo_ia: string | null;
  logo_url: string | null;
  color_banner: string;
  estado: string;
  qr_invitados_token: string | null;
}

interface UseMuroRealtimeReturn {
  event: MuroEvent | null;
  contents: MuroContent[];
  photoContents: MuroContent[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  totalPhotos: number;
  totalMessages: number;
  goToNext: () => void;
  goToPrevious: () => void;
  isEventPaused: boolean;
}

export function useMuroRealtime(token: string): UseMuroRealtimeReturn {
  const [event, setEvent] = useState<MuroEvent | null>(null);
  const [contents, setContents] = useState<MuroContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventPollingRef = useRef<NodeJS.Timeout | null>(null);
  const eventIdRef = useRef<string | null>(null);

  const fetchEvent = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .rpc('get_evento_by_token', { _token: token });

    if (fetchError || !data || data.length === 0) {
      setError('Evento no encontrado');
      setIsLoading(false);
      return null;
    }

    const eventData = data[0];
    setEvent(eventData);
    eventIdRef.current = eventData.id;
    return eventData;
  }, [token]);

  const fetchContents = useCallback(async (eventId: string) => {
    const { data, error: fetchError } = await supabase
      .rpc('get_contenido_by_evento_token', { 
        _evento_id: eventId, 
        _token: token 
      });

    if (fetchError) {
      console.error('Error fetching contents:', fetchError);
      return;
    }

    const mappedContents: MuroContent[] = (data || [])
      .filter((c: { tipo: string }) => c.tipo === 'foto' || c.tipo === 'mensaje')
      .map((c: { id: string; tipo: string; url_original: string | null; url_ia: string | null; mensaje_texto: string | null; invitado_nombre: string | null; likes_count: number; created_at: string; estado_ia: string }) => ({
        id: c.id,
        tipo: c.tipo as 'foto' | 'video' | 'mensaje',
        url_original: c.url_original,
        url_ia: c.url_ia,
        mensaje_texto: c.mensaje_texto,
        invitado_nombre: c.invitado_nombre,
        likes_count: c.likes_count,
        created_at: c.created_at,
        estado_ia: c.estado_ia as 'pendiente' | 'procesando' | 'completado' | 'error',
      }));

    setContents(mappedContents);
    setIsLoading(false);
  }, [token]);

  // Configurar suscripción realtime con polling fallback
  const setupRealtime = useCallback((eventId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`muro-${eventId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contenido',
          filter: `evento_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('🔴 Realtime INSERT:', payload.new);
          const raw = payload.new as Record<string, unknown>;
          // Solo agregar fotos y mensajes, no videos
          if (raw.tipo !== 'foto' && raw.tipo !== 'mensaje') return;
          if (raw.aprobado === false) return;
          
          const newContent: MuroContent = {
            id: raw.id as string,
            tipo: raw.tipo as 'foto' | 'video' | 'mensaje',
            url_original: (raw.url_original as string) || null,
            url_ia: (raw.url_ia as string) || null,
            mensaje_texto: (raw.mensaje_texto as string) || null,
            invitado_nombre: (raw.invitado_nombre as string) || null,
            likes_count: (raw.likes_count as number) || 0,
            created_at: (raw.created_at as string) || new Date().toISOString(),
            estado_ia: (raw.estado_ia as MuroContent['estado_ia']) || 'pendiente',
          };
          setContents(prev => [newContent, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contenido',
          filter: `evento_id=eq.${eventId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          // Skip non-photo/message content
          if (raw.tipo !== 'foto' && raw.tipo !== 'mensaje') return;
          
          const updated: MuroContent = {
            id: raw.id as string,
            tipo: raw.tipo as 'foto' | 'video' | 'mensaje',
            url_original: (raw.url_original as string) || null,
            url_ia: (raw.url_ia as string) || null,
            mensaje_texto: (raw.mensaje_texto as string) || null,
            invitado_nombre: (raw.invitado_nombre as string) || null,
            likes_count: (raw.likes_count as number) || 0,
            created_at: (raw.created_at as string) || new Date().toISOString(),
            estado_ia: (raw.estado_ia as MuroContent['estado_ia']) || 'pendiente',
          };

          setContents(prev => {
            const exists = prev.some(c => c.id === updated.id);
            
            if (raw.aprobado === true && !exists) {
              // Content was just approved by moderator — add it to the wall
              return [updated, ...prev];
            }
            
            if (raw.aprobado === false && exists) {
              // Content was rejected — remove it from the wall
              return prev.filter(c => c.id !== updated.id);
            }
            
            // Update existing content (e.g. likes, IA status)
            return prev.map(c => (c.id === updated.id ? updated : c));
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    channelRef.current = channel;

    // Polling fallback: re-fetch contents every 10s to catch anything realtime missed
    const contentPoll = setInterval(() => {
      if (eventIdRef.current) {
        fetchContents(eventIdRef.current);
      }
    }, 10000);

    return () => clearInterval(contentPoll);
  }, [fetchContents]);

  // Inicialización
  useEffect(() => {
    let contentPollCleanup: (() => void) | undefined;

    const init = async () => {
      const eventData = await fetchEvent();
      if (eventData) {
        await fetchContents(eventData.id);
        contentPollCleanup = setupRealtime(eventData.id);
        
        // Polling para estado del evento
        eventPollingRef.current = setInterval(async () => {
          const { data } = await supabase
            .rpc('get_evento_by_token', { _token: token });
          
          if (data && data.length > 0) {
            setEvent(prev => prev ? { ...prev, estado: data[0].estado } : null);
          }
        }, 5000);
      }
    };

    init();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
      if (eventPollingRef.current) {
        clearInterval(eventPollingRef.current);
      }
      contentPollCleanup?.();
    };
  }, [token, fetchEvent, fetchContents, setupRealtime]);

  const photoContents = contents.filter((c) => c.tipo === 'foto');
  const isEventPaused = event?.estado === 'pausado';

  // Auto-rotación del carrusel
  useEffect(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }

    if (isEventPaused || photoContents.length <= 1) return;

    carouselIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photoContents.length);
    }, APP_CONFIG.CAROUSEL_PHOTO_DURATION);

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [photoContents.length, isEventPaused]);

  const goToNext = useCallback(() => {
    if (photoContents.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photoContents.length);
  }, [photoContents.length]);

  const goToPrevious = useCallback(() => {
    if (photoContents.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photoContents.length) % photoContents.length);
  }, [photoContents.length]);

  const totalPhotos = photoContents.length;
  const totalMessages = contents.filter((c) => c.tipo === 'mensaje').length;

  return {
    event,
    contents,
    photoContents,
    currentIndex,
    isLoading,
    error,
    totalPhotos,
    totalMessages,
    goToNext,
    goToPrevious,
    isEventPaused,
  };
}
