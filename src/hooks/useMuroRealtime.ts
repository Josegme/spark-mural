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

  // Cargar evento por token
  const fetchEvent = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('eventos')
      .select('id, nombre, tipo, es_premium, tema_ia, estilo_ia, logo_url, color_banner, estado')
      .eq('qr_pantalla_token', token)
      .single();

    if (fetchError) {
      setError('Evento no encontrado');
      setIsLoading(false);
      return null;
    }

    setEvent(data);
    return data;
  }, [token]);

  // Cargar contenido inicial
  const fetchContents = useCallback(async (eventId: string) => {
    const { data, error: fetchError } = await supabase
      .from('contenido')
      .select('id, tipo, url_original, url_ia, mensaje_texto, invitado_nombre, likes_count, created_at, estado_ia')
      .eq('evento_id', eventId)
      .eq('aprobado', true)
      .in('tipo', ['foto', 'mensaje']) // Solo fotos y mensajes - videos van al álbum
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching contents:', fetchError);
      return;
    }

    setContents(data as MuroContent[] || []);
    setIsLoading(false);
  }, []);

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
        
        // Polling para detectar cambios de estado (cada 5 segundos)
        eventPollingRef.current = setInterval(async () => {
          const { data } = await supabase
            .from('eventos')
            .select('estado')
            .eq('qr_pantalla_token', token)
            .single();
          
          if (data) {
            setEvent(prev => prev ? { ...prev, estado: data.estado } : null);
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
