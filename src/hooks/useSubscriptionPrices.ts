/**
 * PICKEVENT - Hook para precios de suscripciones
 * Lee precios de suscripciones desde configuración global (lectura pública)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  nombre: string;
  precio: number;
  limite_eventos: number;
  descripcion: string;
  features: string[];
  popular?: boolean;
}

export interface SubscriptionPrices {
  starter: number;
  profesional: number;
  ilimitado: number;
}

// Valores por defecto si falla la lectura (sincronizados con Super Admin)
const DEFAULT_PRICES: SubscriptionPrices = {
  starter: 270000,
  profesional: 350000,
  ilimitado: 500000,
};

// Metadata de los planes (no cambia, solo los precios)
const PLAN_METADATA = {
  starter: {
    id: 'starter',
    nombre: 'Starter',
    limite_eventos: 10,
    descripcion: 'Ideal para salones pequeños',
    features: [
      '10 eventos por mes',
      'Muro interactivo en tiempo real',
      '3 QR codes por evento',
      'Álbum descargable (30 días)',
      'Soporte por email',
    ],
  },
  profesional: {
    id: 'profesional',
    nombre: 'Profesional',
    limite_eventos: 20,
    descripcion: 'Para salones con demanda media',
    popular: true,
    features: [
      '20 eventos por mes',
      'Todo lo del plan Starter',
      'Eventos Premium con IA',
      'Personalización avanzada',
      'Soporte prioritario',
      'Reportes detallados',
    ],
  },
  ilimitado: {
    id: 'ilimitado',
    nombre: 'Ilimitado',
    limite_eventos: -1,
    descripcion: 'Sin límites para grandes empresas',
    features: [
      'Eventos ilimitados',
      'Todo lo del plan Profesional',
      'API acceso (próximamente)',
      'White-label opcional',
      'Soporte dedicado 24/7',
      'Capacitación incluida',
    ],
  },
};

export function useSubscriptionPrices() {
  const pricesQuery = useQuery({
    queryKey: ['subscription-prices'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      // Leer configuración global desde función (más robusto para cualquier rol)
      // y fallback a lectura directa.
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_global_config', {
        config_key: 'precios_suscripciones',
      });

      const { data: tableData, error: tableError } = rpcData
        ? { data: null, error: null }
        : await supabase
            .from('configuracion_global')
            .select('clave, valor')
            .eq('clave', 'precios_suscripciones')
            .maybeSingle();

      // Si hay error o no hay datos, usar valores por defecto
      let prices = DEFAULT_PRICES;
      const effectiveError = rpcError || tableError;
      const rawValue = (rpcData ?? tableData?.valor) as unknown;

      if (!effectiveError && rawValue) {
        const dynamicPrices = rawValue as SubscriptionPrices;
        prices = {
          starter: dynamicPrices?.starter || DEFAULT_PRICES.starter,
          profesional: dynamicPrices?.profesional || DEFAULT_PRICES.profesional,
          ilimitado: dynamicPrices?.ilimitado || DEFAULT_PRICES.ilimitado,
        };
      }

      // Combinar precios dinámicos con metadata estática
      return [
        {
          ...PLAN_METADATA.starter,
          precio: prices.starter,
        },
        {
          ...PLAN_METADATA.profesional,
          precio: prices.profesional,
        },
        {
          ...PLAN_METADATA.ilimitado,
          precio: prices.ilimitado,
        },
      ];
    },
    // Queremos que el salón vea cambios del Super Admin sin “hard refresh”
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  });

  return {
    plans: pricesQuery.data || [],
    isLoading: pricesQuery.isLoading,
    refetch: pricesQuery.refetch,
  };
}
