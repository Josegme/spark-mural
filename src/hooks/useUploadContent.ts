/**
 * PICKEVENT - Hook para subir contenido
 * Maneja uploads de fotos, videos y mensajes
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceId, validateFileSize, validateFileExtension } from '@/lib/utils';
import { APP_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { toast } from 'sonner';

interface EventInfo {
  id: string;
  nombre: string;
  tipo: string;
  es_premium: boolean;
  tema_ia: string | null;
  estilo_ia: string | null;
  logo_url: string | null;
  color_banner: string;
  estado: string;
  limite_subidas_por_invitado: number | null;
  moderacion_activa: boolean;
}

interface UploadResult {
  success: boolean;
  contentId?: string;
  error?: string;
}

interface UseUploadContentReturn {
  event: EventInfo | null;
  isLoading: boolean;
  error: string | null;
  uploadsRemaining: number | null;
  uploadPhoto: (file: File, guestName: string, message?: string) => Promise<UploadResult>;
  uploadVideo: (file: File, guestName: string) => Promise<UploadResult>;
  sendMessage: (message: string, guestName: string) => Promise<UploadResult>;
  isUploading: boolean;
}

export function useUploadContent(token: string): UseUploadContentReturn {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadsCount, setUploadsCount] = useState(0);

  const deviceId = generateDeviceId();

  // Cargar evento por token de invitados
  const fetchEvent = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('eventos')
      .select('id, nombre, tipo, es_premium, tema_ia, estilo_ia, logo_url, color_banner, estado, limite_subidas_por_invitado, moderacion_activa')
      .eq('qr_invitados_token', token)
      .single();

    if (fetchError) {
      setError(ERROR_MESSAGES.EVENT_NOT_FOUND);
      setIsLoading(false);
      return null;
    }

    if (data.estado !== 'activo' && data.estado !== 'programado') {
      setError(ERROR_MESSAGES.EVENT_NOT_ACTIVE);
      setIsLoading(false);
      return null;
    }

    setEvent(data);
    
    // Contar uploads previos de este dispositivo
    const { count } = await supabase
      .from('contenido')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', data.id)
      .eq('invitado_device_id', deviceId);

    setUploadsCount(count || 0);
    setIsLoading(false);
    return data;
  }, [token, deviceId]);

  // Inicializar
  useState(() => {
    fetchEvent();
  });

  // Calcular uploads restantes
  const uploadsRemaining = event?.limite_subidas_por_invitado 
    ? Math.max(0, event.limite_subidas_por_invitado - uploadsCount)
    : null;

  // Validar si puede subir
  const canUpload = (): boolean => {
    if (!event) return false;
    if (event.limite_subidas_por_invitado && uploadsCount >= event.limite_subidas_por_invitado) {
      toast.error(ERROR_MESSAGES.UPLOAD_LIMIT_REACHED);
      return false;
    }
    return true;
  };

  // Subir foto
  const uploadPhoto = async (file: File, guestName: string, message?: string): Promise<UploadResult> => {
    if (!canUpload() || !event) return { success: false, error: 'No se puede subir' };

    // Validaciones
    if (!validateFileSize(file, APP_CONFIG.MAX_PHOTO_SIZE_MB)) {
      toast.error(ERROR_MESSAGES.PHOTO_TOO_LARGE);
      return { success: false, error: ERROR_MESSAGES.PHOTO_TOO_LARGE };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validateFileExtension(file.name, [...APP_CONFIG.ALLOWED_PHOTO_EXTENSIONS])) {
      toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
      return { success: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
    }

    setIsUploading(true);

    try {
      // Subir archivo a storage
      const fileName = `${event.id}/${Date.now()}_${deviceId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('contenido-eventos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('contenido-eventos')
        .getPublicUrl(fileName);

      // Insertar en tabla contenido
      const { data: contentData, error: insertError } = await supabase
        .from('contenido')
        .insert({
          evento_id: event.id,
          tipo: 'foto',
          url_original: urlData.publicUrl,
          invitado_nombre: guestName.trim() || null,
          invitado_device_id: deviceId,
          mensaje_texto: message?.trim() || null,
          aprobado: !event.moderacion_activa,
          estado_ia: event.es_premium ? 'pendiente' : 'completado',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      setUploadsCount((prev) => prev + 1);
      toast.success(SUCCESS_MESSAGES.PHOTO_UPLOADED);
      return { success: true, contentId: contentData.id };
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error al subir la foto');
      return { success: false, error: 'Error de subida' };
    } finally {
      setIsUploading(false);
    }
  };

  // Subir video
  const uploadVideo = async (file: File, guestName: string): Promise<UploadResult> => {
    if (!canUpload() || !event) return { success: false, error: 'No se puede subir' };

    if (!validateFileSize(file, APP_CONFIG.MAX_VIDEO_SIZE_MB)) {
      toast.error(ERROR_MESSAGES.VIDEO_TOO_LARGE);
      return { success: false, error: ERROR_MESSAGES.VIDEO_TOO_LARGE };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validateFileExtension(file.name, [...APP_CONFIG.ALLOWED_VIDEO_EXTENSIONS])) {
      toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
      return { success: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
    }

    setIsUploading(true);

    try {
      const fileName = `${event.id}/${Date.now()}_${deviceId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('contenido-eventos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contenido-eventos')
        .getPublicUrl(fileName);

      const { data: contentData, error: insertError } = await supabase
        .from('contenido')
        .insert({
          evento_id: event.id,
          tipo: 'video',
          url_original: urlData.publicUrl,
          invitado_nombre: guestName.trim() || null,
          invitado_device_id: deviceId,
          aprobado: !event.moderacion_activa,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      setUploadsCount((prev) => prev + 1);
      toast.success(SUCCESS_MESSAGES.VIDEO_UPLOADED);
      return { success: true, contentId: contentData.id };
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error al subir el video');
      return { success: false, error: 'Error de subida' };
    } finally {
      setIsUploading(false);
    }
  };

  // Enviar mensaje
  const sendMessage = async (message: string, guestName: string): Promise<UploadResult> => {
    if (!canUpload() || !event) return { success: false, error: 'No se puede enviar' };

    if (message.length > APP_CONFIG.MAX_MESSAGE_LENGTH) {
      toast.error(ERROR_MESSAGES.MESSAGE_TOO_LONG);
      return { success: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
    }

    setIsUploading(true);

    try {
      const { data: contentData, error: insertError } = await supabase
        .from('contenido')
        .insert({
          evento_id: event.id,
          tipo: 'mensaje',
          mensaje_texto: message.trim(),
          invitado_nombre: guestName.trim() || null,
          invitado_device_id: deviceId,
          aprobado: !event.moderacion_activa,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      setUploadsCount((prev) => prev + 1);
      toast.success(SUCCESS_MESSAGES.MESSAGE_SENT);
      return { success: true, contentId: contentData.id };
    } catch (err) {
      console.error('Message error:', err);
      toast.error('Error al enviar el mensaje');
      return { success: false, error: 'Error de envío' };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    event,
    isLoading,
    error,
    uploadsRemaining,
    uploadPhoto,
    uploadVideo,
    sendMessage,
    isUploading,
  };
}
