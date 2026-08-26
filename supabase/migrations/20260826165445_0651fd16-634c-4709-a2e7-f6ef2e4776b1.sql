ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS muro_fondo_url text,
  ADD COLUMN IF NOT EXISTS muro_ocultar_banner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS muro_qr_flotante boolean NOT NULL DEFAULT true;

DROP FUNCTION IF EXISTS public.get_evento_by_token(text);

CREATE FUNCTION public.get_evento_by_token(_token text)
 RETURNS TABLE(id uuid, nombre text, tipo text, fecha_evento date, hora_inicio time without time zone, duracion_horas integer, estado text, es_premium boolean, color_banner text, logo_url text, estilo_ia text, tema_ia text, moderacion_activa boolean, total_fotos integer, total_videos integer, total_mensajes integer, total_likes integer, qr_invitados_token text, muro_fondo_url text, muro_ocultar_banner boolean, muro_qr_flotante boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    e.id,
    e.nombre,
    e.tipo::text,
    e.fecha_evento,
    e.hora_inicio,
    e.duracion_horas,
    e.estado::text,
    e.es_premium,
    e.color_banner,
    e.logo_url,
    e.estilo_ia::text,
    e.tema_ia,
    e.moderacion_activa,
    e.total_fotos,
    e.total_videos,
    e.total_mensajes,
    e.total_likes,
    e.qr_invitados_token,
    e.muro_fondo_url,
    e.muro_ocultar_banner,
    e.muro_qr_flotante
  FROM eventos e
  WHERE 
    (e.qr_pantalla_token = _token OR e.qr_invitados_token = _token OR e.qr_descarga_token = _token)
    AND e.estado IN ('activo', 'programado', 'finalizado', 'pausado')
$function$;

REVOKE ALL ON FUNCTION public.get_evento_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_evento_by_token(text) TO anon, authenticated, service_role;