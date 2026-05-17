CREATE OR REPLACE FUNCTION public.crear_rsvp(_token text, _nombre text, _email text, _telefono text, _acompanantes integer, _restricciones text, _mensaje text, _device_id text)
 RETURNS TABLE(qr_token text, estado text, motivo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_evento public.eventos%ROWTYPE;
  v_token text;
  v_acompanantes int := COALESCE(_acompanantes, 0);
  v_confirmados int;
BEGIN
  SELECT e.* INTO v_evento FROM public.eventos e
   WHERE e.qr_invitaciones_token = _token
     AND e.invitaciones_activas = true
     AND e.estado IN ('programado', 'activo', 'pausado')
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

  IF _device_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.invitaciones i
       WHERE i.evento_id = v_evento.id AND i.device_id = _device_id
  ) THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'ya_confirmado'::text; RETURN;
  END IF;

  IF _email IS NOT NULL AND length(_email) > 0 AND EXISTS (
       SELECT 1 FROM public.invitaciones i
       WHERE i.evento_id = v_evento.id AND lower(i.email) = lower(_email)
  ) THEN
    RETURN QUERY SELECT NULL::text, 'error'::text, 'email_duplicado'::text; RETURN;
  END IF;

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
$function$;