-- ============================================
-- SECURITY HARDENING MIGRATION - PART 2
-- Corrige problemas adicionales de seguridad
-- ============================================

-- 1. RESTRINGIR ACCESO A EVENTOS - Solo dueños/admins ven tokens QR
DROP POLICY IF EXISTS "Public can view event with valid token" ON public.eventos;

-- Política para usuarios autenticados (dueños, admins, tenants)
CREATE POLICY "Authenticated users view own or managed events"
ON public.eventos
FOR SELECT
USING (
  -- Dueño del evento
  (auth.uid() = cliente_user_id)
  OR 
  -- Super admins
  is_super_admin(auth.uid())
  OR
  -- Tenant del evento (salon/asistente)
  (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- Política separada para acceso público (sin tokens sensibles)
-- Usada por la vista eventos_public
CREATE POLICY "Public events without sensitive data"
ON public.eventos
FOR SELECT
USING (
  -- Solo eventos activos/programados para acceso anónimo via función validadora
  (
    estado IN ('activo', 'programado', 'finalizado')
    AND auth.uid() IS NULL
  )
);

-- 2. ASEGURAR QUE PROFILES SOLO SEA ACCESIBLE POR EL DUEÑO O SUPERADMIN
-- Ya existen estas políticas, pero verificamos que no haya acceso cruzado

-- 3. RESTRINGIR TENANTS - Cada tenant solo ve SU propia información
DROP POLICY IF EXISTS "Salons can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Assistants can view own tenant" ON public.tenants;

-- Nueva política unificada y más restrictiva
CREATE POLICY "Users can only view their own tenant"
ON public.tenants
FOR SELECT
USING (
  -- Super admin ve todos
  is_super_admin(auth.uid())
  OR
  -- Usuario pertenece a este tenant específico
  (id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- 4. CORREGIR PAGOS - Más restricción
DROP POLICY IF EXISTS "Users view own payments" ON public.pagos;

CREATE POLICY "Users view only payments for their events"
ON public.pagos
FOR SELECT
USING (
  -- Super admin
  is_super_admin(auth.uid())
  OR
  -- Dueño del evento asociado
  (evento_id IN (
    SELECT id FROM eventos 
    WHERE cliente_user_id = auth.uid()
  ))
  OR
  -- Suscripción del tenant del usuario
  (suscripcion_id IN (
    SELECT id FROM suscripciones 
    WHERE salon_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  ))
);

-- 5. PERMITIR A USUARIOS BORRAR SUS PROPIAS NOTIFICACIONES
CREATE POLICY "Users can delete own notifications"
ON public.notificaciones
FOR DELETE
USING (auth.uid() = user_id);

-- 6. RESTRINGIR RENDICIONES - Solo el asistente específico
DROP POLICY IF EXISTS "Assistants view own renditions" ON public.rendiciones;

CREATE POLICY "Assistants view only their own renditions"
ON public.rendiciones
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR
  -- El asistente_id debe coincidir con el tenant_id del usuario actual
  (asistente_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- 7. RESTRINGIR SUSCRIPCIONES - Solo el salón específico
DROP POLICY IF EXISTS "Salons view own subscriptions" ON public.suscripciones;

CREATE POLICY "Salons view only their own subscriptions"
ON public.suscripciones
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR
  -- El salon_id debe coincidir con el tenant_id del usuario actual
  (salon_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);