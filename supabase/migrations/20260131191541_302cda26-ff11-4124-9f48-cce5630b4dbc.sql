-- =====================================================
-- CORRECCIÓN DE ERRORES CRÍTICOS DE SEGURIDAD
-- =====================================================

-- ERROR 1: profiles - Customer Contact Information Could Be Stolen
-- Los datos sensibles ya están protegidos, pero reforzamos con políticas explícitas
-- profiles_public ya excluye email/telefono - esto es correcto

-- ERROR 2: tenant_payment_credentials - Payment Gateway Credentials
-- Restringir acceso solo a super_admin (no a usuarios del mismo tenant)
DROP POLICY IF EXISTS "tenant_view_own_credentials" ON public.tenant_payment_credentials;
DROP POLICY IF EXISTS "tenant_insert_own_credentials" ON public.tenant_payment_credentials;
DROP POLICY IF EXISTS "tenant_update_own_credentials" ON public.tenant_payment_credentials;
DROP POLICY IF EXISTS "tenant_delete_own_credentials" ON public.tenant_payment_credentials;

-- Solo super_admin puede gestionar credenciales de pago
-- Las edge functions usan service_role para acceder
CREATE POLICY "Only super admin can view payment credentials"
ON public.tenant_payment_credentials
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admin can insert payment credentials"
ON public.tenant_payment_credentials
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Only super admin can update payment credentials"
ON public.tenant_payment_credentials
FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admin can delete payment credentials"
ON public.tenant_payment_credentials
FOR DELETE
USING (is_super_admin(auth.uid()));

-- ERROR 3: eventos - Business Event Details Exposed
-- Crear una función para validar tokens de acceso
CREATE OR REPLACE FUNCTION public.evento_has_valid_token(
  _evento_id uuid,
  _token text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eventos
    WHERE id = _evento_id
    AND (
      qr_pantalla_token = _token
      OR qr_invitados_token = _token
      OR qr_descarga_token = _token
    )
  )
$$;

-- ERROR 4: contenido - Guest Photos and Messages Exposed
-- La política actual ya filtra por aprobado=true, reforzamos
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.contenido;

CREATE POLICY "Public can view approved content only"
ON public.contenido
FOR SELECT
USING (
  -- Solo contenido aprobado es visible públicamente
  aprobado = true
  -- Y el evento debe estar activo
  AND EXISTS (
    SELECT 1 FROM public.eventos
    WHERE id = evento_id
    AND estado IN ('activo', 'programado', 'finalizado')
  )
);

-- Agregar política explícita de denegación para campos sensibles
-- Crear vista segura de contenido que excluye IP y device_id
DROP VIEW IF EXISTS public.contenido_public;
CREATE VIEW public.contenido_public
WITH (security_invoker = on) AS
SELECT 
  id,
  evento_id,
  tipo,
  url_original,
  url_ia,
  mensaje_texto,
  estado_ia,
  aprobado,
  moderado,
  likes_count,
  -- Excluimos invitado_device_id e ip_address por privacidad
  COALESCE(invitado_nombre, 'Invitado') as invitado_nombre,
  created_at
FROM public.contenido;

-- Agregar RLS a las vistas para evitar bypass
-- profiles_public ya tiene security_invoker, confirmamos

-- pagos_summary - agregar política
-- Como es una vista, necesitamos que el SELECT base tenga RLS correcto
-- La vista ya excluye el monto, lo cual está bien

-- Reforzar notificaciones - solo sistema puede insertar
DROP POLICY IF EXISTS "System can insert notifications" ON public.notificaciones;
CREATE POLICY "Only service role can insert notifications"
ON public.notificaciones
FOR INSERT
WITH CHECK (
  -- Solo el service_role (desde edge functions) puede crear notificaciones
  auth.role() = 'service_role' OR is_super_admin(auth.uid())
);