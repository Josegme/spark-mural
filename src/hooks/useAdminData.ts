/**
 * Hook para obtener estadísticas globales del sistema (Super Admin)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GlobalStats {
  totalEvents: number;
  activeEvents: number;
  totalUsers: number;
  totalTenants: number;
  totalPhotos: number;
  totalVideos: number;
  totalMessages: number;
  totalRevenue: number;
}

export interface Tenant {
  id: string;
  nombre: string;
  email: string;
  tipo: 'asistente' | 'salon';
  estado: string;
  pais: string;
  limite_eventos_mes: number | null;
  comision_asistente: number | null;
  comision_superadmin: number | null;
  precio_mensual: number | null;
  fecha_vencimiento: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  pais: string | null;
  tenant_id: string | null;
  created_at: string;
}

export function useAdminData() {
  const { isSuperAdmin } = useAuth();

  // Estadísticas globales
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<GlobalStats> => {
      // Obtener totales de eventos
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id, estado, total_fotos, total_videos, total_mensajes, precio_pagado');
      
      if (eventosError) throw eventosError;

      // Obtener total de usuarios
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      if (usersError) throw usersError;

      // Obtener total de tenants
      const { count: tenantsCount, error: tenantsError } = await supabase
        .from('tenants')
        .select('id', { count: 'exact', head: true });
      
      if (tenantsError) throw tenantsError;

      const totalRevenue = eventos?.reduce((sum, e) => sum + (e.precio_pagado || 0), 0) || 0;

      return {
        totalEvents: eventos?.length || 0,
        activeEvents: eventos?.filter(e => e.estado === 'activo').length || 0,
        totalUsers: usersCount || 0,
        totalTenants: tenantsCount || 0,
        totalPhotos: eventos?.reduce((sum, e) => sum + e.total_fotos, 0) || 0,
        totalVideos: eventos?.reduce((sum, e) => sum + e.total_videos, 0) || 0,
        totalMessages: eventos?.reduce((sum, e) => sum + e.total_mensajes, 0) || 0,
        totalRevenue,
      };
    },
    enabled: isSuperAdmin(),
  });

  // Lista de tenants
  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async (): Promise<Tenant[]> => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin(),
  });

  // Lista de usuarios
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin(),
  });

  return {
    stats: statsQuery.data,
    tenants: tenantsQuery.data || [],
    users: usersQuery.data || [],
    isLoading: statsQuery.isLoading || tenantsQuery.isLoading || usersQuery.isLoading,
    error: statsQuery.error || tenantsQuery.error || usersQuery.error,
    refetch: () => {
      statsQuery.refetch();
      tenantsQuery.refetch();
      usersQuery.refetch();
    },
  };
}
