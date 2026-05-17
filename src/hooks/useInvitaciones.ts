/**
 * Hooks para Invitaciones Digitales (RSVP + admin)
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceId } from '@/lib/utils';

// Datos públicos del evento para mostrar la invitación
export interface InvitacionEventoPublico {
  evento_id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  color_banner: string | null;
  logo_url: string | null;
  mensaje: string | null;
  acompanantes_max: number;
  fecha_limite_rsvp: string | null;
  cupo_maximo: number | null;
  cupo_restante: number | null;
  tarjeta_url: string | null;
  tarjeta_formato: string | null;
}

export function useInvitacionPublica(token: string | undefined) {
  return useQuery({
    queryKey: ['invitacion-publica', token],
    queryFn: async (): Promise<InvitacionEventoPublico | null> => {
      if (!token) return null;
      const { data, error } = await supabase.rpc('get_invitacion_evento_by_token', {
        _token: token,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    },
    enabled: !!token,
  });
}

export interface RSVPInput {
  token: string;
  nombre: string;
  email?: string;
  telefono?: string;
  acompanantes: number;
  restricciones?: string;
  mensaje?: string;
}

export function useCrearRSVP() {
  return useMutation({
    mutationFn: async (input: RSVPInput) => {
      const deviceId = generateDeviceId();
      const { data, error } = await supabase.rpc('crear_rsvp', {
        _token: input.token,
        _nombre: input.nombre,
        _email: input.email || null,
        _telefono: input.telefono || null,
        _acompanantes: input.acompanantes,
        _restricciones: input.restricciones || null,
        _mensaje: input.mensaje || null,
        _device_id: deviceId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || row.estado !== 'ok') {
        const motivos: Record<string, string> = {
          invalido: 'Invitación inválida o evento cancelado',
          cerrado: 'La fecha límite para confirmar ya pasó',
          cupo_excedido: 'No hay cupo disponible',
          acompanantes_excedidos: 'Te pasaste del máximo de acompañantes',
          ya_confirmado: 'Ya confirmaste tu asistencia desde este dispositivo',
          email_duplicado: 'Este email ya confirmó asistencia',
          nombre_invalido: 'El nombre es inválido',
        };
        throw new Error(motivos[row?.motivo as string] || 'No se pudo confirmar');
      }
      return row.qr_token as string;
    },
  });
}

export interface InvitacionPersonal {
  invitacion_id: string;
  evento_id: string;
  nombre: string;
  acompanantes: number;
  estado: string;
  evento_nombre: string;
  fecha_evento: string;
  hora_inicio: string;
  color_banner: string | null;
  logo_url: string | null;
  ya_ingreso: boolean;
}

export function useInvitacionPersonal(qrToken: string | undefined) {
  return useQuery({
    queryKey: ['mi-invitacion', qrToken],
    queryFn: async (): Promise<InvitacionPersonal | null> => {
      if (!qrToken) return null;
      const { data, error } = await supabase.rpc('get_invitacion_personal', {
        _qr_token: qrToken,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    },
    enabled: !!qrToken,
  });
}

// ===== Admin: gestión desde el dashboard del organizador =====

export interface InvitacionRow {
  id: string;
  evento_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado: string;
  acompanantes: number;
  restricciones: string | null;
  mensaje_anfitrion: string | null;
  qr_token: string;
  confirmado_at: string | null;
  created_at: string;
}

export interface CheckinRow {
  id: string;
  invitacion_id: string;
  evento_id: string;
  ingreso_at: string;
}

export function useInvitacionesAdmin(eventoId: string | undefined) {
  const qc = useQueryClient();

  const invitaciones = useQuery({
    queryKey: ['invitaciones-admin', eventoId],
    queryFn: async (): Promise<InvitacionRow[]> => {
      if (!eventoId) return [];
      const { data, error } = await supabase
        .from('invitaciones')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as InvitacionRow[]) || [];
    },
    enabled: !!eventoId,
  });

  const checkins = useQuery({
    queryKey: ['checkins-admin', eventoId],
    queryFn: async (): Promise<CheckinRow[]> => {
      if (!eventoId) return [];
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('evento_id', eventoId);
      if (error) throw error;
      return (data as CheckinRow[]) || [];
    },
    enabled: !!eventoId,
  });

  // Realtime
  useEffect(() => {
    if (!eventoId) return;
    const ch = supabase
      .channel(`inv-${eventoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitaciones', filter: `evento_id=eq.${eventoId}` },
        () => qc.invalidateQueries({ queryKey: ['invitaciones-admin', eventoId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `evento_id=eq.${eventoId}` },
        () => qc.invalidateQueries({ queryKey: ['checkins-admin', eventoId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventoId, qc]);

  return {
    invitaciones: invitaciones.data || [],
    checkins: checkins.data || [],
    isLoading: invitaciones.isLoading || checkins.isLoading,
  };
}

/** Genera tokens si faltan y activa el módulo en el evento */
export function useActivarInvitaciones(eventoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      activar: boolean;
      cupo_maximo: number | null;
      acompanantes_max: number;
      fecha_limite_rsvp: string | null;
      mensaje: string | null;
      tarjeta_url?: string | null;
      tarjeta_formato?: string | null;
    }) => {
      if (!eventoId) throw new Error('No event');
      // Generar tokens si activamos y aún no existen
      const { data: ev } = await supabase
        .from('eventos')
        .select('qr_invitaciones_token, qr_checkin_token')
        .eq('id', eventoId)
        .single();

      const updates: Record<string, unknown> = {
        invitaciones_activas: config.activar,
        invitaciones_cupo_maximo: config.cupo_maximo,
        invitaciones_acompanantes_max: config.acompanantes_max,
        invitaciones_fecha_limite_rsvp: config.fecha_limite_rsvp,
        invitaciones_mensaje: config.mensaje,
      };
      if (config.tarjeta_url !== undefined) updates.invitacion_tarjeta_url = config.tarjeta_url;
      if (config.tarjeta_formato !== undefined) updates.invitacion_tarjeta_formato = config.tarjeta_formato;

      const randHex = (n: number) => {
        const bytes = new Uint8Array(n);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      if (config.activar && !ev?.qr_invitaciones_token) updates.qr_invitaciones_token = randHex(16);
      if (config.activar && !ev?.qr_checkin_token) updates.qr_checkin_token = randHex(16);

      const { error } = await supabase.from('eventos').update(updates).eq('id', eventoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-details', eventoId] });
    },
  });
}

/** Sube una tarjeta digital al bucket público y devuelve la URL */
export async function uploadTarjetaInvitacion(eventoId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${eventoId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('invitacion-tarjetas')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('invitacion-tarjetas').getPublicUrl(path);
  return data.publicUrl;
}
