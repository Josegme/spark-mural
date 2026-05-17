
-- ============================================================
-- INVITACIONES DIGITALES - MVP
-- ============================================================

-- 1. Enum para estado de invitación
DO $$ BEGIN
  CREATE TYPE public.invitacion_status AS ENUM ('pendiente', 'confirmado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extensión de tabla eventos
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS invitaciones_activas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invitaciones_cupo_maximo integer,
  ADD COLUMN IF NOT EXISTS invitaciones_acompanantes_max integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitaciones_fecha_limite_rsvp timestamptz,
  ADD COLUMN IF NOT EXISTS invitaciones_mensaje text,
  ADD COLUMN IF NOT EXISTS qr_invitaciones_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_checkin_token text UNIQUE;

-- 3. Tabla invitaciones
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  qr_token text NOT NULL UNIQUE,
  nombre text NOT NULL,
  email text,
  telefono text,
  estado public.invitacion_status NOT NULL DEFAULT 'confirmado',
  acompanantes integer NOT NULL DEFAULT 0,
  restricciones text,
  mensaje_anfitrion text,
  device_id text,
  confirmado_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_evento ON public.invitaciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_qr_token ON public.invitaciones(qr_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitaciones_evento_device
  ON public.invitaciones(evento_id, device_id) WHERE device_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitaciones_evento_email
  ON public.invitaciones(evento_id, lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view event invitaciones"
  ON public.invitaciones FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
    OR evento_id IN (
      SELECT e.id FROM public.eventos e
      WHERE e.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Owners can update invitaciones"
  ON public.invitaciones FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
  );

CREATE POLICY "Owners can delete invitaciones"
  ON public.invitaciones FOR DELETE
  USING (
    is_super_admin(auth.uid())
    OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
  );

-- 4. Tabla checkins
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitacion_id uuid NOT NULL UNIQUE REFERENCES public.invitaciones(id) ON DELETE CASCADE,
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  operador_user_id uuid,
  ingreso_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_evento ON public.checkins(evento_id);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view checkins"
  ON public.checkins FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
    OR evento_id IN (
      SELECT e.id FROM public.eventos e
      WHERE e.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 5. RPC: get_invitacion_evento_by_token (PII enmascarada)
CREATE OR REPLACE FUNCTION public.get_invitacion_evento_by_token(_token text)
RETURNS TABLE(
  evento_id uuid,
  nombre text,
  tipo text,
  fecha_evento date,
  hora_inicio time,
  color_banner text,
  logo_url text,
  mensaje text,
  acompanantes_max integer,
  fecha_limite_rsvp timestamptz,
  cupo_maximo integer,
  cupo_restante integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    END
  FROM public.eventos e
  WHERE e.qr_invitaciones_token = _token
    AND e.invitaciones_activas = true
    AND e.estado IN ('programado', 'activo', 'pausado');
$$;

-- 6. RPC: crear_rsvp
CREATE OR REPLACE FUNCTION public.crear_rsvp(
  _token text,
  _nombre text,
  _email text,
  _telefono text,
  _acompanantes integer,
  _restricciones text,
  _mensaje text,
  _device_id text
)
RETURNS TABLE(qr_token text, estado text, motivo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento public.eventos%ROWTYPE;
  v_token text;
  v_acompanantes int := COALESCE(_acompanantes, 0);
  v_confirmados int;
BEGIN
  SELECT * INTO v_evento FROM public.eventos
   WHERE qr_invitaciones_token = _token
     AND invitaciones_activas = true
     AND estado IN ('programado', 'activo', 'pausado')
   LIMIT 1;

  IF v_evento.id IS NULL THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'invalido'::text; RETURN;
  END IF;

  IF v_evento.invitaciones_fecha_limite_rsvp IS NOT NULL
     AND now() > v_evento.invitaciones_fecha_limite_rsvp THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'cerrado'::text; RETURN;
  END IF;

  IF v_acompanantes > COALESCE(v_evento.invitaciones_acompanantes_max, 0) THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'acompanantes_excedidos'::text; RETURN;
  END IF;

  IF _nombre IS NULL OR length(trim(_nombre)) = 0 OR length(_nombre) > 100 THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'nombre_invalido'::text; RETURN;
  END IF;

  -- Duplicados
  IF _device_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.invitaciones
       WHERE evento_id = v_evento.id AND device_id = _device_id
  ) THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'ya_confirmado'::text; RETURN;
  END IF;

  IF _email IS NOT NULL AND length(_email) > 0 AND EXISTS (
       SELECT 1 FROM public.invitaciones
       WHERE evento_id = v_evento.id AND lower(email) = lower(_email)
  ) THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'email_duplicado'::text; RETURN;
  END IF;

  -- Cupo
  IF v_evento.invitaciones_cupo_maximo IS NOT NULL THEN
    SELECT COALESCE(SUM(1 + i.acompanantes), 0) INTO v_confirmados
      FROM public.invitaciones i
      WHERE i.evento_id = v_evento.id AND i.estado = 'confirmado';
    IF v_confirmados + 1 + v_acompanantes > v_evento.invitaciones_cupo_maximo THEN
      RETURN QUERY SELECT NULL::text, 'error'::text, 'cupo_excedido'::text; RETURN;
    END IF;
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.invitaciones (
    evento_id, qr_token, nombre, email, telefono,
    estado, acompanantes, restricciones, mensaje_anfitrion, device_id, confirmado_at
  ) VALUES (
    v_evento.id, v_token, trim(_nombre),
    NULLIF(trim(COALESCE(_email,'')), ''),
    NULLIF(trim(COALESCE(_telefono,'')), ''),
    'confirmado', v_acompanantes,
    NULLIF(trim(COALESCE(_restricciones,'')), ''),
    NULLIF(trim(COALESCE(_mensaje,'')), ''),
    _device_id, now()
  );

  RETURN QUERY SELECT v_token, 'ok'::text, NULL::text;
END;
$$;

-- 7. RPC: get_invitacion_personal
CREATE OR REPLACE FUNCTION public.get_invitacion_personal(_qr_token text)
RETURNS TABLE(
  invitacion_id uuid,
  evento_id uuid,
  nombre text,
  acompanantes integer,
  estado text,
  evento_nombre text,
  fecha_evento date,
  hora_inicio time,
  color_banner text,
  logo_url text,
  ya_ingreso boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id, i.evento_id, i.nombre, i.acompanantes, i.estado::text,
    e.nombre, e.fecha_evento, e.hora_inicio, e.color_banner, e.logo_url,
    EXISTS(SELECT 1 FROM public.checkins c WHERE c.invitacion_id = i.id)
  FROM public.invitaciones i
  JOIN public.eventos e ON e.id = i.evento_id
  WHERE i.qr_token = _qr_token;
$$;

-- 8. RPC: validar_checkin
CREATE OR REPLACE FUNCTION public.validar_checkin(
  _checkin_token text,
  _invitacion_qr_token text,
  _operador_id uuid
)
RETURNS TABLE(estado text, nombre text, acompanantes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento_id uuid;
  v_inv public.invitaciones%ROWTYPE;
BEGIN
  SELECT id INTO v_evento_id FROM public.eventos
   WHERE qr_checkin_token = _checkin_token LIMIT 1;

  IF v_evento_id IS NULL THEN
    RETURN QUERY SELECT 'token_invalido'::text, NULL::text, NULL::int; RETURN;
  END IF;

  SELECT * INTO v_inv FROM public.invitaciones
   WHERE qr_token = _invitacion_qr_token LIMIT 1;

  IF v_inv.id IS NULL OR v_inv.evento_id <> v_evento_id THEN
    RETURN QUERY SELECT 'invalido'::text, NULL::text, NULL::int; RETURN;
  END IF;

  IF v_inv.estado <> 'confirmado' THEN
    RETURN QUERY SELECT 'no_confirmado'::text, v_inv.nombre, v_inv.acompanantes; RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.checkins WHERE invitacion_id = v_inv.id) THEN
    RETURN QUERY SELECT 'ya_ingreso'::text, v_inv.nombre, v_inv.acompanantes; RETURN;
  END IF;

  INSERT INTO public.checkins (invitacion_id, evento_id, operador_user_id)
  VALUES (v_inv.id, v_evento_id, _operador_id);

  RETURN QUERY SELECT 'ok'::text, v_inv.nombre, v_inv.acompanantes;
END;
$$;

-- 9. Grants para anon/authenticated en RPCs
GRANT EXECUTE ON FUNCTION public.get_invitacion_evento_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_rsvp(text, text, text, text, integer, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitacion_personal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_checkin(text, text, uuid) TO authenticated;

-- 10. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
