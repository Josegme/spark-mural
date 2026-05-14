/**
 * PICKEVENT - Hook para datos del salón
 * Obtiene eventos, suscripción, límites y estadísticas
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SalonEvent {
  id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  estado: string;
  es_premium: boolean;
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  qr_pantalla_token: string;
  qr_invitados_token: string;
  qr_descarga_token: string;
  created_at: string;
}

export interface SalonSubscription {
  id: string;
  plan_id: string;
  plan_nombre?: string;
  precio_mensual: number;
  precio_plan_actual?: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  fecha_proximo_pago: string;
  estado: string;
  salon_id: string;
  limite_eventos_mes?: number;
}

export interface SalonTenantInfo {
  id: string;
  nombre: string;
  email: string;
  pais: string;
  limite_eventos_mes: number;
  estado: string;
  eventos_cortesia_disponibles: number;
}

export interface SalonStats {
  totalEventos: number;
  eventosEsteMes: number;
  limiteEventosMes: number;
  porcentajeUso: number;
  eventosActivos: number;
  eventosProgramados: number;
  diasHastaVencimiento: number;
  suscripcionActiva: boolean;
  puedeCrearEvento: boolean;
  alertaLimite: boolean; // Al 80%
  alertaVencimiento: boolean; // 7 días
  alertaCritica: boolean; // Vencida
  cortesiasDisponibles: number;
  usandoCortesia: boolean; // Sin suscripción activa pero con cortesías > 0
  cortesiaAgotada: boolean; // Sin suscripción activa y cortesías = 0
}

export function useSalonData() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  // Obtener info del tenant (salón)
  const tenantQuery = useQuery({
    queryKey: ['salon-tenant', tenantId],
    queryFn: async (): Promise<SalonTenantInfo | null> => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('id, nombre, email, pais, limite_eventos_mes, estado')
        .eq('id', tenantId)
        .eq('tipo', 'salon')
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }
      return data;
    },
    enabled: !!tenantId,
  });

  // Obtener suscripción activa
  const suscripcionQuery = useQuery({
    queryKey: ['salon-suscripcion', tenantId],
    queryFn: async (): Promise<SalonSubscription | null> => {
      if (!tenantId) return null;

      const { data: suscripcion, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('salon_id', tenantId)
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching suscripcion:', error);
        return null;
      }

      // Obtener info del plan y precio real desde configuracion_global
      if (suscripcion?.plan_id) {
        const { data: plan } = await supabase
          .from('planes')
          .select('nombre, limite_eventos_mes, precio_sugerido')
          .eq('id', suscripcion.plan_id)
          .single();

        // Leer precio real desde configuracion_global (fuente de verdad del Super Admin)
        let precioReal = plan?.precio_sugerido || suscripcion.precio_mensual;
        const planNombre = (plan?.nombre || 'Plan').toLowerCase();

        const { data: preciosGlobal } = await supabase.rpc('get_global_config', {
          config_key: 'precios_suscripciones',
        });

        if (preciosGlobal) {
          const precios = preciosGlobal as Record<string, number>;
          // Mapear nombre del plan a clave de configuracion_global
          if (planNombre.includes('starter') && precios.starter) {
            precioReal = precios.starter;
          } else if (planNombre.includes('profesional') && precios.profesional) {
            precioReal = precios.profesional;
          } else if (planNombre.includes('ilimitado') && precios.ilimitado) {
            precioReal = precios.ilimitado;
          }
        }

        return {
          ...suscripcion,
          plan_nombre: plan?.nombre || 'Plan',
          limite_eventos_mes: plan?.limite_eventos_mes || 20,
          precio_plan_actual: precioReal,
        };
      }

      return suscripcion;
    },
    enabled: !!tenantId,
  });

  // Obtener eventos del salón
  const eventosQuery = useQuery({
    queryKey: ['salon-eventos', tenantId],
    queryFn: async (): Promise<SalonEvent[]> => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha_evento', { ascending: true });

      if (error) {
        console.error('Error fetching eventos:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!tenantId,
  });

  // Calcular estadísticas y alertas
  const calculateStats = (): SalonStats => {
    const eventos = eventosQuery.data || [];
    const suscripcion = suscripcionQuery.data;
    const tenant = tenantQuery.data;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Eventos del mes actual
    const eventosEsteMes = eventos.filter(e => {
      const fechaCreacion = new Date(e.created_at);
      return fechaCreacion >= startOfMonth && fechaCreacion <= endOfMonth;
    });

    // Límite de eventos
    const limiteEventosMes = suscripcion?.limite_eventos_mes || tenant?.limite_eventos_mes || 20;
    const porcentajeUso = Math.round((eventosEsteMes.length / limiteEventosMes) * 100);

    // Días hasta vencimiento
    const fechaVencimiento = suscripcion?.fecha_vencimiento 
      ? new Date(suscripcion.fecha_vencimiento) 
      : null;
    const diasHastaVencimiento = fechaVencimiento 
      ? Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Estado de suscripción
    const suscripcionActiva = suscripcion?.estado === 'activo' && diasHastaVencimiento > 0;

    // Alertas
    const alertaLimite = porcentajeUso >= 80;
    const alertaVencimiento = diasHastaVencimiento > 0 && diasHastaVencimiento <= 7;
    const alertaCritica = diasHastaVencimiento <= 0 || suscripcion?.estado !== 'activo';

    // Puede crear evento
    const puedeCrearEvento = suscripcionActiva && eventosEsteMes.length < limiteEventosMes;

    return {
      totalEventos: eventos.length,
      eventosEsteMes: eventosEsteMes.length,
      limiteEventosMes,
      porcentajeUso,
      eventosActivos: eventos.filter(e => e.estado === 'activo').length,
      eventosProgramados: eventos.filter(e => e.estado === 'programado').length,
      diasHastaVencimiento,
      suscripcionActiva,
      puedeCrearEvento,
      alertaLimite,
      alertaVencimiento,
      alertaCritica,
    };
  };

  // Obtener eventos para calendario (próximos 30 días)
  const getEventosCalendario = () => {
    const eventos = eventosQuery.data || [];
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return eventos.filter(e => {
      const fecha = new Date(e.fecha_evento);
      return fecha >= now && fecha <= in30Days;
    });
  };

  const refetch = () => {
    tenantQuery.refetch();
    suscripcionQuery.refetch();
    eventosQuery.refetch();
  };

  return {
    stats: calculateStats(),
    eventos: eventosQuery.data || [],
    eventosCalendario: getEventosCalendario(),
    suscripcion: suscripcionQuery.data,
    tenantInfo: tenantQuery.data,
    isLoading: tenantQuery.isLoading || suscripcionQuery.isLoading || eventosQuery.isLoading,
    refetch,
  };
}
