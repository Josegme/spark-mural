/**
 * PICKEVENT - Hook para configuración global
 * Permite al Super Admin leer y editar precios, comisiones, límites
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PreciosEventos {
  basico: number;
  premium: number;
}

export interface PreciosSuscripciones {
  starter: number;
  profesional: number;
  ilimitado: number;
}

export interface ComisionesDefault {
  asistente: number;
  superadmin: number;
}

export interface LimitesDefault {
  eventos_mes_asistente: number;
  eventos_mes_salon: number;
  cortesias_iniciales: number;
}

export interface ContactoEmpresarial {
  whatsapp: string;
  mensaje: string;
}

export interface GlobalConfig {
  precios_eventos: PreciosEventos;
  precios_suscripciones: PreciosSuscripciones;
  comisiones_default: ComisionesDefault;
  limites_default: LimitesDefault;
  contacto_empresarial: ContactoEmpresarial;
}

type ConfigKey = keyof GlobalConfig;

export function useGlobalConfig() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener toda la configuración
  const configQuery = useQuery({
    queryKey: ['global-config'],
    queryFn: async (): Promise<GlobalConfig> => {
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('clave, valor');

      if (error) throw error;

      const configObj = {
        precios_eventos: { basico: 10000, premium: 25000 },
        precios_suscripciones: { starter: 270000, profesional: 350000, ilimitado: 500000 },
        comisiones_default: { asistente: 50, superadmin: 50 },
        limites_default: { eventos_mes_asistente: 30, eventos_mes_salon: 20, cortesias_iniciales: 2 },
        contacto_empresarial: { whatsapp: '3764606205', mensaje: 'Hola! Quiero información sobre planes empresariales.' },
      } as GlobalConfig;
      
      data?.forEach((item) => {
        const key = item.clave as ConfigKey;
        if (key === 'precios_eventos') configObj.precios_eventos = item.valor as unknown as PreciosEventos;
        else if (key === 'precios_suscripciones') configObj.precios_suscripciones = item.valor as unknown as PreciosSuscripciones;
        else if (key === 'comisiones_default') configObj.comisiones_default = item.valor as unknown as ComisionesDefault;
        else if (key === 'limites_default') configObj.limites_default = item.valor as unknown as LimitesDefault;
        else if (key === 'contacto_empresarial') configObj.contacto_empresarial = item.valor as unknown as ContactoEmpresarial;
      });

      return configObj;
    },
    enabled: isSuperAdmin(),
  });

  // Mutación para actualizar configuración
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: ConfigKey; value: unknown }) => {
      const { error } = await supabase
        .from('configuracion_global')
        .update({ 
          valor: JSON.parse(JSON.stringify(value)),
          updated_at: new Date().toISOString()
        })
        .eq('clave', key);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['global-config'] });
      
      // Invalidar caches relacionados según el tipo de configuración actualizada
      if (variables.key === 'precios_eventos') {
        queryClient.invalidateQueries({ queryKey: ['public-prices'] });
      }
      if (variables.key === 'precios_suscripciones') {
        queryClient.invalidateQueries({ queryKey: ['subscription-prices'] });
      }
      
      toast({
        title: 'Configuración actualizada',
        description: `Se actualizó ${variables.key} correctamente`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
      console.error('Error updating config:', error);
    },
  });

  const updateConfig = (key: ConfigKey, value: unknown) => {
    updateConfigMutation.mutate({ key, value });
  };

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    updateConfig,
    isUpdating: updateConfigMutation.isPending,
    refetch: configQuery.refetch,
  };
}
