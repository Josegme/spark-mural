/**
 * Hook para obtener detalles de un evento y su contenido
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EventContent {
  id: string;
  evento_id: string;
  tipo: 'foto' | 'video' | 'mensaje';
  url_original: string | null;
  url_ia: string | null;
  mensaje_texto: string | null;
  invitado_nombre: string | null;
  estado_ia: string;
  moderado: boolean;
  aprobado: boolean;
  likes_count: number;
  created_at: string;
}

export interface EventDetails {
  id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  estado: string;
  es_premium: boolean;
  tema_ia: string | null;
  estilo_ia: string | null;
  qr_pantalla_token: string;
  qr_invitados_token: string;
  qr_descarga_token: string;
  color_banner: string | null;
  logo_url: string | null;
  moderacion_activa: boolean;
  limite_subidas_por_invitado: number | null;
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  total_likes: number;
  album_disponible_hasta: string | null;
  created_at: string;
  precio_pagado: number;
  payment_link?: string | null;
  pago_estado?: string | null;
  muro_fondo_url?: string | null;
  muro_ocultar_banner?: boolean | null;
  muro_qr_flotante?: boolean | null;
}

export function useEventDetails(eventId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Obtener detalles del evento
  const eventQuery = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async (): Promise<EventDetails | null> => {
      if (!eventId || !user?.id) return null;

      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      // Buscar estado de pago y link si existe un pago asociado
      let paymentLink: string | null = null;
      let pagoEstado: string | null = null;
      
      try {
        const { data: pagoData } = await supabase
          .from('pagos')
          .select('estado, metadata')
          .eq('evento_id', eventId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (pagoData) {
          pagoEstado = pagoData.estado;
          if (pagoData.metadata) {
            const metadata = pagoData.metadata as Record<string, unknown>;
            paymentLink = (metadata.init_point as string) || (metadata.sandbox_init_point as string) || null;
          }
        }
      } catch {
        // Asistente may not have RLS access to pagos — graceful degradation
      }

      return { ...data, payment_link: paymentLink, pago_estado: pagoEstado };
    },
    enabled: !!eventId && !!user?.id,
  });

  // Obtener contenido del evento
  const contentQuery = useQuery({
    queryKey: ['event-content', eventId],
    queryFn: async (): Promise<EventContent[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('contenido')
        .select('*')
        .eq('evento_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Moderar contenido (aprobar/rechazar)
  const moderateMutation = useMutation({
    mutationFn: async ({ contentId, aprobado }: { contentId: string; aprobado: boolean }) => {
      const { error } = await supabase
        .from('contenido')
        .update({ aprobado, moderado: true })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-content', eventId] });
      toast({
        title: 'Contenido moderado',
        description: 'El estado del contenido ha sido actualizado',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo moderar el contenido',
        variant: 'destructive',
      });
    },
  });

  // Actualizar configuración del evento
  const updateEventMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!eventId) throw new Error('No event ID');

      const { error } = await supabase
        .from('eventos')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['event-details', eventId] });
      const previousEvent = queryClient.getQueryData<EventDetails | null>(['event-details', eventId]);

      queryClient.setQueryData<EventDetails | null>(['event-details', eventId], (current) => {
        if (!current) return current;
        return { ...current, ...updates };
      });

      return { previousEvent };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      toast({
        title: 'Evento actualizado',
        description: 'Los cambios han sido guardados',
      });
    },
    onError: (_error, _updates, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(['event-details', eventId], context.previousEvent);
      }
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
    },
  });

  // Cambiar estado del evento
  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!eventId) throw new Error('No event ID');

      const updates: Record<string, unknown> = { estado: newStatus };
      
      if (newStatus === 'activo') {
        updates.fecha_inicio_real = new Date().toISOString();
      } else if (newStatus === 'finalizado') {
        updates.fecha_fin_real = new Date().toISOString();
      }

      const { error } = await supabase
        .from('eventos')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast({
        title: 'Estado actualizado',
        description: `El evento ahora está ${newStatus}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado',
        variant: 'destructive',
      });
    },
  });

  // Eliminar evento
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event ID');

      // El DELETE directo falla por RLS (no hay policies de DELETE en eventos/contenido/pagos).
      // Para no tocar políticas, delegamos el borrado a una función backend con service role.
      const { data, error } = await supabase.functions.invoke('delete-event', {
        body: { eventId },
      });

      if (error) {
        // `error.message` suele traer el status + texto; lo propagamos para mostrarlo en UI.
        throw new Error(error.message);
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'No se pudo eliminar el evento');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({
        title: 'Evento eliminado',
        description: 'El evento y todo su contenido han sido eliminados',
      });
      // Navegar al dashboard después de eliminar exitosamente
      navigate('/dashboard');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el evento';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  return {
    event: eventQuery.data,
    content: contentQuery.data || [],
    isLoading: eventQuery.isLoading || contentQuery.isLoading,
    error: eventQuery.error || contentQuery.error,
    moderate: moderateMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    changeStatus: changeStatusMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isUpdating: updateEventMutation.isPending || changeStatusMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    refetch: () => {
      eventQuery.refetch();
      contentQuery.refetch();
    },
  };
}
