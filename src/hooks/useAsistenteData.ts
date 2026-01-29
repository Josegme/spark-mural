/**
 * PICKEVENT - Hook para datos del asistente
 * Obtiene eventos, clientes, rendiciones y estadísticas
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AsistenteEvent {
  id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  estado: string;
  es_premium: boolean;
  precio_pagado: number;
  cliente_user_id: string;
  cliente_nombre?: string;
  cliente_email?: string;
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  created_at: string;
  qr_pantalla_token?: string;
  qr_invitados_token?: string;
  qr_descarga_token?: string;
  // Payment status
  pago_estado?: 'pendiente' | 'aprobado' | 'rechazado' | null;
  payment_link?: string | null;
}

export interface AsistenteCliente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  pais?: string;
  total_eventos: number;
  total_facturado: number;
  created_at: string;
}

export interface AsistenteRendicion {
  id: string;
  periodo_desde: string;
  periodo_hasta: string;
  total_eventos: number;
  monto_total_vendido: number;
  comision_asistente: number;
  monto_a_rendir: number;
  estado: string;
  fecha_rendicion?: string;
  fecha_verificacion?: string;
  notas?: string;
  created_at: string;
}

export interface AsistenteTenantInfo {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  comision_asistente: number;
  comision_superadmin: number;
  estado: string;
  limite_eventos_mes: number;
  eventos_cortesia_disponibles: number;
  eventos_vendidos_total: number;
}

export interface AsistenteStats {
  totalEventos: number;
  eventosActivos: number;
  eventosEsteMes: number;
  facturacionTotal: number;
  facturacionMes: number;
  comisionTotal: number;
  comisionMes: number;
  pendienteRendir: number;
  totalClientes: number;
  limiteEventosMes: number;
  eventosUsados: number;
  puedeCrearEvento: boolean;
}

export function useAsistenteData() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  // Obtener info del tenant (asistente)
  const tenantQuery = useQuery({
    queryKey: ['asistente-tenant', tenantId],
    queryFn: async (): Promise<AsistenteTenantInfo | null> => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('id, nombre, email, pais, comision_asistente, comision_superadmin, estado, limite_eventos_mes, eventos_cortesia_disponibles, eventos_vendidos_total')
        .eq('id', tenantId)
        .eq('tipo', 'asistente')
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }
      return {
        ...data,
        comision_asistente: data.comision_asistente ?? 50,
        comision_superadmin: data.comision_superadmin ?? 50,
        limite_eventos_mes: data.limite_eventos_mes ?? 30,
        eventos_cortesia_disponibles: data.eventos_cortesia_disponibles ?? 2,
        eventos_vendidos_total: data.eventos_vendidos_total ?? 0,
      };
    },
    enabled: !!tenantId,
  });

  // Obtener eventos del asistente
  const eventosQuery = useQuery({
    queryKey: ['asistente-eventos', tenantId],
    queryFn: async (): Promise<AsistenteEvent[]> => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha_evento', { ascending: false });

      if (error) {
        console.error('Error fetching eventos:', error);
        return [];
      }

      // Obtener info de clientes y pagos para cada evento
      const eventosConInfo = await Promise.all(
        (data || []).map(async (evento) => {
          // Get client info
          const { data: clienteData } = await supabase
            .from('profiles')
            .select('nombre, email')
            .eq('id', evento.cliente_user_id)
            .maybeSingle();

          // Get payment info for this event
          const { data: pagoData } = await supabase
            .from('pagos')
            .select('estado, metadata')
            .eq('evento_id', evento.id)
            .order('created_at', { ascending: false })
            .maybeSingle();

          // Extract checkout URL from metadata if payment is pending
          let paymentLink: string | null = null;
          if (pagoData?.estado === 'pendiente' && pagoData?.metadata) {
            const metadata = pagoData.metadata as Record<string, unknown>;
            paymentLink = (metadata.init_point || metadata.checkout_url || null) as string | null;
          }

          return {
            ...evento,
            cliente_nombre: clienteData?.nombre || 'Cliente',
            cliente_email: clienteData?.email || '',
            pago_estado: pagoData?.estado as 'pendiente' | 'aprobado' | 'rechazado' | null,
            payment_link: paymentLink,
          };
        })
      );

      return eventosConInfo;
    },
    enabled: !!tenantId,
  });

  // Obtener clientes únicos (users con eventos de este asistente)
  const clientesQuery = useQuery({
    queryKey: ['asistente-clientes', tenantId],
    queryFn: async (): Promise<AsistenteCliente[]> => {
      if (!tenantId) return [];

      // Obtener eventos para sacar clientes únicos
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('cliente_user_id, precio_pagado')
        .eq('tenant_id', tenantId);

      if (eventosError || !eventos) return [];

      // Agrupar por cliente
      const clienteIds = [...new Set(eventos.map(e => e.cliente_user_id))];
      
      const clientesData = await Promise.all(
        clienteIds.map(async (clienteId) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, nombre, email, telefono, pais, created_at')
            .eq('id', clienteId)
            .single();

          const clienteEventos = eventos.filter(e => e.cliente_user_id === clienteId);
          
          return {
            id: profileData?.id || clienteId,
            nombre: profileData?.nombre || 'Sin nombre',
            email: profileData?.email || '',
            telefono: profileData?.telefono,
            pais: profileData?.pais,
            total_eventos: clienteEventos.length,
            total_facturado: clienteEventos.reduce((sum, e) => sum + e.precio_pagado, 0),
            created_at: profileData?.created_at || new Date().toISOString(),
          };
        })
      );

      return clientesData;
    },
    enabled: !!tenantId,
  });

  // Obtener rendiciones
  const rendicionesQuery = useQuery({
    queryKey: ['asistente-rendiciones', tenantId],
    queryFn: async (): Promise<AsistenteRendicion[]> => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('rendiciones')
        .select('*')
        .eq('asistente_id', tenantId)
        .order('periodo_hasta', { ascending: false });

      if (error) {
        console.error('Error fetching rendiciones:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!tenantId,
  });

  // Calcular estadísticas
  const calculateStats = (): AsistenteStats => {
    const eventos = eventosQuery.data || [];
    const rendiciones = rendicionesQuery.data || [];
    const clientes = clientesQuery.data || [];
    const tenant = tenantQuery.data;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Eventos del mes (creados este mes)
    const eventosEsteMes = eventos.filter(e => 
      new Date(e.created_at) >= startOfMonth
    );

    // Límite y uso
    const limiteEventosMes = tenant?.limite_eventos_mes ?? 20;
    const eventosUsados = eventos.length; // Total de eventos creados por el asistente

    // Facturación
    const facturacionTotal = eventos.reduce((sum, e) => sum + e.precio_pagado, 0);
    const facturacionMes = eventosEsteMes.reduce((sum, e) => sum + e.precio_pagado, 0);

    // Comisiones (porcentaje del asistente)
    const comisionPorcentaje = tenant?.comision_asistente ?? 50;
    const comisionTotal = Math.round(facturacionTotal * (comisionPorcentaje / 100));
    const comisionMes = Math.round(facturacionMes * (comisionPorcentaje / 100));

    // Pendiente a rendir (% para super admin)
    const rendido = rendiciones
      .filter(r => r.estado === 'verificado')
      .reduce((sum, r) => sum + r.monto_a_rendir, 0);
    
    const superadminPorcentaje = tenant?.comision_superadmin ?? 50;
    const totalARendir = Math.round(facturacionTotal * (superadminPorcentaje / 100));
    const pendienteRendir = totalARendir - rendido;

    return {
      totalEventos: eventos.length,
      eventosActivos: eventos.filter(e => e.estado === 'activo').length,
      eventosEsteMes: eventosEsteMes.length,
      facturacionTotal,
      facturacionMes,
      comisionTotal,
      comisionMes,
      pendienteRendir: Math.max(0, pendienteRendir),
      totalClientes: clientes.length,
      limiteEventosMes,
      eventosUsados,
      puedeCrearEvento: eventosUsados < limiteEventosMes && tenant?.estado === 'activo',
    };
  };

  const refetch = () => {
    tenantQuery.refetch();
    eventosQuery.refetch();
    clientesQuery.refetch();
    rendicionesQuery.refetch();
  };

  return {
    stats: calculateStats(),
    eventos: eventosQuery.data || [],
    clientes: clientesQuery.data || [],
    rendiciones: rendicionesQuery.data || [],
    tenantInfo: tenantQuery.data,
    isLoading: tenantQuery.isLoading || eventosQuery.isLoading || 
               clientesQuery.isLoading || rendicionesQuery.isLoading,
    refetch,
  };
}
