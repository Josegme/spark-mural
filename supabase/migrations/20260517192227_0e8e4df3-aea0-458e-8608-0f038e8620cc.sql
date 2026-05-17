
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS invitacion_tarjeta_url text,
  ADD COLUMN IF NOT EXISTS invitacion_tarjeta_formato text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('invitacion-tarjetas', 'invitacion-tarjetas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read invitacion tarjetas" ON storage.objects;
CREATE POLICY "Public read invitacion tarjetas"
ON storage.objects FOR SELECT
USING (bucket_id = 'invitacion-tarjetas');

DROP POLICY IF EXISTS "Owners can upload invitacion tarjetas" ON storage.objects;
CREATE POLICY "Owners can upload invitacion tarjetas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invitacion-tarjetas'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.eventos e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.cliente_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owners can update invitacion tarjetas" ON storage.objects;
CREATE POLICY "Owners can update invitacion tarjetas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invitacion-tarjetas'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.eventos e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.cliente_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owners can delete invitacion tarjetas" ON storage.objects;
CREATE POLICY "Owners can delete invitacion tarjetas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invitacion-tarjetas'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.eventos e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.cliente_user_id = auth.uid()
    )
  )
);

DROP FUNCTION IF EXISTS public.get_invitacion_evento_by_token(text);

CREATE FUNCTION public.get_invitacion_evento_by_token(_token text)
 RETURNS TABLE(evento_id uuid, nombre text, tipo text, fecha_evento date, hora_inicio time without time zone, color_banner text, logo_url text, mensaje text, acompanantes_max integer, fecha_limite_rsvp timestamp with time zone, cupo_maximo integer, cupo_restante integer, tarjeta_url text, tarjeta_formato text)
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
    e.color_banner,
    e.logo_url,
    e.invitaciones_mensaje,
    e.invitaciones_acompanantes_max,
    e.invitaciones_fecha_limite_rsvp,
    e.invitaciones_cupo_maximo,
    CASE
      WHEN e.invitaciones_cupo_maximo IS NULL THEN NULL
      ELSE GREATEST(
        e.invitaciones_cupo_maximo
          - COALESCE((SELECT SUM(1 + i.acompanantes) FROM public.invitaciones i
                      WHERE i.evento_id = e.id AND i.estado = 'confirmado'), 0)::int,
        0
      )
    END,
    e.invitacion_tarjeta_url,
    e.invitacion_tarjeta_formato
  FROM public.eventos e
  WHERE e.qr_invitaciones_token = _token
    AND e.invitaciones_activas = true
    AND e.estado IN ('programado', 'activo', 'pausado');
$function$;
