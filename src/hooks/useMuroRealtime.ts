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

  // Cargar evento por token usando función RPC segura
  const fetchEvent = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .rpc('get_evento_by_token', { _token: token });

    if (fetchError || !data || data.length === 0) {
      setError('Evento no encontrado');
      setIsLoading(false);
      return null;
    }

    // La función retorna un array, tomamos el primer resultado
    const eventData = data[0];
    setEvent(eventData);
    return eventData;
  }, [token]);

  // Cargar contenido inicial usando función RPC segura
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

    // Mapear el resultado al formato esperado
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

  // Configurar suscripción realtime
  const setupRealtime = useCallback((eventId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`muro-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contenido',
          filter: `evento_id=eq.${eventId}`,
        },
        (payload) => {
          const newContent = payload.new as MuroContent & { aprobado?: boolean };
          if (newContent.aprobado !== false) {
            setContents((prev) => [newContent, ...prev]);
          }
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
          const updated = payload.new as MuroContent;
          setContents((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Inicialización
  useEffect(() => {
    const init = async () => {
      const eventData = await fetchEvent();
      if (eventData) {
        await fetchContents(eventData.id);
        setupRealtime(eventData.id);
        
        // Polling para detectar cambios de estado (usa función RPC segura)
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
    };
  }, [token, fetchEvent, fetchContents, setupRealtime]);

  // Solo fotos para el carrusel (mensajes van en globitos flotantes)
  const photoContents = contents.filter((c) => c.tipo === 'foto');

  // El carrusel se pausa si el evento está pausado
  const isEventPaused = event?.estado === 'pausado';

  // Auto-rotación del carrusel (solo fotos) - se pausa si el evento está pausado
  useEffect(() => {
    // Limpiar intervalo previo
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }

    // No iniciar carrusel si está pausado o hay pocas fotos
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

  // Navegación manual (solo entre fotos)
  const goToNext = useCallback(() => {
    if (photoContents.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photoContents.length);
  }, [photoContents.length]);

  const goToPrevious = useCallback(() => {
    if (photoContents.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photoContents.length) % photoContents.length);
  }, [photoContents.length]);

  // Estadísticas
  const totalPhotos = photoContents.length;
  const totalMessages = contents.filter((c) => c.tipo === 'mensaje').length;

  return {
    event,
    contents, // Todos los contenidos (para mensajes flotantes)
    photoContents, // Solo fotos (para el carrusel)
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
