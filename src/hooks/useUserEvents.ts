/**
 * Hook para obtener los eventos del usuario autenticado
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserEvent {
  id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  estado: string;
  es_premium: boolean;
  qr_pantalla_token: string;
  qr_invitados_token: string;
  qr_descarga_token: string;
  color_banner: string | null;
  logo_url: string | null;
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  total_likes: number;
  album_disponible_hasta: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalPhotos: number;
  totalVideos: number;
  totalMessages: number;
  totalLikes: number;
}

export function useUserEvents() {
  const { user } = useAuth();

  const eventsQuery = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async (): Promise<UserEvent[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('cliente_user_id', user.id)
        .order('fecha_evento', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calcular estadísticas
  const stats: DashboardStats = {
    totalEvents: eventsQuery.data?.length || 0,
    activeEvents: eventsQuery.data?.filter(e => e.estado === 'activo').length || 0,
    totalPhotos: eventsQuery.data?.reduce((sum, e) => sum + e.total_fotos, 0) || 0,
    totalVideos: eventsQuery.data?.reduce((sum, e) => sum + e.total_videos, 0) || 0,
    totalMessages: eventsQuery.data?.reduce((sum, e) => sum + e.total_mensajes, 0) || 0,
    totalLikes: eventsQuery.data?.reduce((sum, e) => sum + e.total_likes, 0) || 0,
  };

  return {
    events: eventsQuery.data || [],
    stats,
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
  };
}
