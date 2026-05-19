/**
 * PICKEVENT - Módulo de Certificados
 * Hooks para gestionar plantillas y emisión de certificados por evento
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CertTipo = 'participacion' | 'asistencia' | 'agradecimiento' | 'diploma' | 'personalizado';
export type CertPlantilla = 'moderna' | 'clasica' | 'festiva';
export type CertOrientacion = 'horizontal' | 'vertical';
export type CertTipografia = 'sans' | 'serif' | 'script' | 'mixta';

export interface Firma {
  nombre: string;
  cargo: string;
  imagen_url: string | null;
}

export interface Certificado {
  id: string;
  evento_id: string;
  tipo: CertTipo;
  plantilla: CertPlantilla;
  orientacion: CertOrientacion;
  titulo: string;
  texto_principal: string;
  texto_secundario: string | null;
  organizador: string | null;
  lugar: string | null;
  logo_principal_url: string | null;
  logo_secundario_url: string | null;
  firmas: Firma[];
  color_primario: string;
  color_secundario: string;
  tipografia: CertTipografia;
  fondo_url: string | null;
  fondo_opacidad: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificadoEmitido {
  id: string;
  certificado_id: string;
  evento_id: string;
  invitacion_id: string | null;
  nombre_destinatario: string;
  email_destinatario: string | null;
  codigo_verificacion: string;
  pdf_url: string | null;
  enviado_email: boolean;
  enviado_at: string | null;
  created_at: string;
}

export const TIPO_PRESETS: Record<CertTipo, { label: string; titulo: string; texto: string }> = {
  participacion: {
    label: 'Participación',
    titulo: 'Certificado de Participación',
    texto: 'Se otorga el presente certificado a {nombre} por su participación en {evento} realizado el {fecha}.',
  },
  asistencia: {
    label: 'Asistencia',
    titulo: 'Certificado de Asistencia',
    texto: 'Se certifica la asistencia de {nombre} al evento {evento} llevado a cabo el {fecha}.',
  },
  agradecimiento: {
    label: 'Agradecimiento',
    titulo: 'Agradecimiento',
    texto: 'Agradecemos a {nombre} por acompañarnos en {evento} el {fecha}. Tu presencia hizo este día inolvidable.',
  },
  diploma: {
    label: 'Diploma / Finalización',
    titulo: 'Diploma',
    texto: 'Se otorga el presente diploma a {nombre} por haber completado satisfactoriamente {evento} el {fecha}.',
  },
  personalizado: {
    label: 'Personalizado',
    titulo: 'Certificado',
    texto: 'Texto del certificado para {nombre}. Evento: {evento}. Fecha: {fecha}.',
  },
};

/** Genera un código alfanumérico corto para verificación */
export function generarCodigoVerificacion(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

/** Reemplaza variables del texto con datos del invitado/evento */
export function renderTexto(
  template: string,
  vars: { nombre: string; evento: string; fecha: string; lugar?: string; organizador?: string; duracion?: string }
): string {
  return template
    .replace(/\{nombre\}/g, vars.nombre)
    .replace(/\{evento\}/g, vars.evento)
    .replace(/\{fecha\}/g, vars.fecha)
    .replace(/\{lugar\}/g, vars.lugar || '')
    .replace(/\{organizador\}/g, vars.organizador || '')
    .replace(/\{duracion\}/g, vars.duracion || '');
}

export function useCertificado(eventoId: string | undefined) {
  return useQuery({
    queryKey: ['certificado', eventoId],
    queryFn: async (): Promise<Certificado | null> => {
      if (!eventoId) return null;
      const { data, error } = await supabase
        .from('certificados')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Certificado) || null;
    },
    enabled: !!eventoId,
  });
}

export function useCertificadosEmitidos(eventoId: string | undefined) {
  return useQuery({
    queryKey: ['certificados-emitidos', eventoId],
    queryFn: async (): Promise<CertificadoEmitido[]> => {
      if (!eventoId) return [];
      const { data, error } = await supabase
        .from('certificados_emitidos')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as CertificadoEmitido[]) || [];
    },
    enabled: !!eventoId,
  });
}

export function useGuardarCertificado(eventoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Certificado> & { id?: string }) => {
      if (!eventoId) throw new Error('No event');
      const payload = { ...input, evento_id: eventoId };
      if (input.id) {
        const { error } = await supabase
          .from('certificados')
          .update(payload as never)
          .eq('id', input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase
        .from('certificados')
        .insert(payload as never)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificado', eventoId] });
    },
  });
}

/** Sube un asset (logo o firma) al bucket de certificados */
export async function uploadCertAsset(eventoId: string, file: File, kind: 'logo' | 'firma'): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const folder = kind === 'logo' ? 'logos' : 'firmas';
  const path = `${folder}/${eventoId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('certificados')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('certificados').getPublicUrl(path);
  return data.publicUrl;
}

/** Crea un registro de certificado emitido en la BD */
export async function crearCertificadoEmitido(input: {
  certificado_id: string;
  evento_id: string;
  invitacion_id?: string | null;
  nombre_destinatario: string;
  email_destinatario?: string | null;
}): Promise<CertificadoEmitido> {
  const codigo = generarCodigoVerificacion();
  const { data, error } = await supabase
    .from('certificados_emitidos')
    .insert({
      certificado_id: input.certificado_id,
      evento_id: input.evento_id,
      invitacion_id: input.invitacion_id || null,
      nombre_destinatario: input.nombre_destinatario,
      email_destinatario: input.email_destinatario || null,
      codigo_verificacion: codigo,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as CertificadoEmitido;
}

/** Llama a la edge function para subir PDF y enviar email (opcional) */
export async function enviarCertificado(input: {
  certificado_emitido_id: string;
  pdf_base64: string;
  email_to?: string | null;
  thumbnail_base64?: string | null;
}): Promise<{ success: boolean; pdf_url: string | null }> {
  const { data, error } = await supabase.functions.invoke('enviar-certificado', {
    body: input,
  });
  if (error) throw error;
  return data as { success: boolean; pdf_url: string | null };
}

/** Verificación pública */
export interface CertificadoPublico {
  codigo: string;
  nombre_destinatario: string;
  titulo: string;
  evento_nombre: string;
  fecha_evento: string;
  organizador: string | null;
  emitido_at: string;
}

export function useCertificadoPublico(codigo: string | undefined) {
  return useQuery({
    queryKey: ['certificado-publico', codigo],
    queryFn: async (): Promise<CertificadoPublico | null> => {
      if (!codigo) return null;
      const { data, error } = await supabase.rpc('get_certificado_by_codigo', { _codigo: codigo });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as CertificadoPublico) || null;
    },
    enabled: !!codigo,
  });
}
