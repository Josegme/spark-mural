/**
 * PICKEVENT - Hook para precios públicos
 * Lee precios de eventos desde configuración global (lectura pública)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_PRICES } from '@/lib/constants';

export interface EventPrices {
  basico: {
    nombre: string;
    precio: number;
    descripcion: string;
    features: readonly string[];
  };
  premium: {
    nombre: string;
    precio: number;
    descripcion: string;
    features: readonly string[];
  };
}

export function usePublicPrices() {
  const pricesQuery = useQuery({
    queryKey: ['public-prices'],
    queryFn: async (): Promise<EventPrices> => {
      // Intentar leer de configuración global
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('clave, valor')
        .eq('clave', 'precios_eventos')
        .maybeSingle();

      // Si hay error o no hay datos, usar valores hardcodeados
      if (error || !data) {
        console.log('Using default prices from constants');
        return EVENT_PRICES;
      }

      // Combinar precios dinámicos con metadata estática
      const dynamicPrices = data.valor as { basico: number; premium: number };
      
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
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  return {
    prices: pricesQuery.data || EVENT_PRICES,
    isLoading: pricesQuery.isLoading,
  };
}
