/**
 * PICKEVENT - Hook para precios públicos de eventos
 * Lee precios de eventos desde configuración global via RPC (bypass RLS)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_PRICES } from '@/lib/constants';

export interface EventPlanDetails {
  nombre: string;
  precio: number;
  descripcion: string;
  features: readonly string[];
}

export interface EventPrices {
  basico: EventPlanDetails;
  premium: EventPlanDetails;
}

export function usePublicPrices() {
  const pricesQuery = useQuery({
    queryKey: ['public-prices'],
    queryFn: async (): Promise<EventPrices> => {
      // Usar RPC get_global_config para bypass de RLS (funciona para anónimos y autenticados)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_global_config', {
        config_key: 'precios_eventos',
      });

      // Fallback a lectura directa de tabla si RPC falla
      const { data: tableData, error: tableError } = rpcData
        ? { data: null, error: null }
        : await supabase
            .from('configuracion_global')
            .select('clave, valor')
            .eq('clave', 'precios_eventos')
            .maybeSingle();

      const effectiveError = rpcError || tableError;
      const rawValue = (rpcData ?? tableData?.valor) as unknown;

      // Si hay error o no hay datos, usar valores hardcodeados como último recurso
      if (effectiveError || !rawValue) {
        console.log('Using default prices from constants (RPC + table failed)');
        return EVENT_PRICES;
      }

      // Combinar precios dinámicos con metadata estática
      const dynamicPrices = rawValue as { basico: number; premium: number };
      
      return {
        basico: {
          ...EVENT_PRICES.basico,
          precio: dynamicPrices.basico || EVENT_PRICES.basico.precio,
        },
        premium: {
          ...EVENT_PRICES.premium,
          precio: dynamicPrices.premium || EVENT_PRICES.premium.precio,
        },
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return {
    prices: pricesQuery.data || EVENT_PRICES,
    isLoading: pricesQuery.isLoading,
  };
}
