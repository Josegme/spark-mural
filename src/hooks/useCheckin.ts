/**
 * Hook para validar check-in escaneando un QR personal
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CheckinResult {
  estado: 'ok' | 'ya_ingreso' | 'no_confirmado' | 'invalido' | 'token_invalido';
  nombre: string | null;
  acompanantes: number | null;
}

export function useCheckin(checkinToken: string | undefined) {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (invitacionQrToken: string): Promise<CheckinResult> => {
      if (!checkinToken) throw new Error('Sin token de check-in');
      const { data, error } = await supabase.rpc('validar_checkin', {
        _checkin_token: checkinToken,
        _invitacion_qr_token: invitacionQrToken,
        _operador_id: user?.id || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row || { estado: 'invalido', nombre: null, acompanantes: null }) as CheckinResult;
    },
  });
}
