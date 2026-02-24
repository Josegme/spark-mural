
DROP FUNCTION IF EXISTS public.get_evento_by_token(text);

CREATE FUNCTION public.get_evento_by_token(_token text)
 RETURNS TABLE(id uuid, nombre text, tipo text, fecha_evento date, hora_inicio time without time zone, duracion_horas integer, estado text, es_premium boolean, color_banner text, logo_url text, estilo_ia text, tema_ia text, moderacion_activa boolean, total_fotos integer, total_videos integer, total_mensajes integer, total_likes integer, qr_invitados_token text)
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
    e.qr_invitados_token
  FROM eventos e
  WHERE 
    (e.qr_pantalla_token = _token OR e.qr_invitados_token = _token OR e.qr_descarga_token = _token)
    AND e.estado IN ('activo', 'programado', 'finalizado', 'pausado')
$function$;
