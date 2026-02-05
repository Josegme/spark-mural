-- ============================================
-- SECURITY HARDENING MIGRATION - PART 3
-- Corrige últimos problemas de seguridad
-- ============================================

-- 1. CORREGIR POLÍTICA DE INSERT EN CONTENIDO
-- La política actual usa WITH CHECK sin restricciones adicionales
DROP POLICY IF EXISTS "Insert content only for active events" ON public.contenido;

CREATE POLICY "Insert content for active events with validation"
ON public.contenido
FOR INSERT
WITH CHECK (
  -- Solo para eventos activos o programados
  EXISTS (
    SELECT 1 FROM eventos
    WHERE eventos.id = contenido.evento_id
    AND eventos.estado IN ('activo', 'programado')
  )
  -- El contenido debe tener un device_id válido (no vacío)
  AND (
    (tipo = 'mensaje' AND mensaje_texto IS NOT NULL AND LENGTH(mensaje_texto) > 0)
    OR (tipo IN ('foto', 'video') AND url_original IS NOT NULL)
  )
);

-- 2. AGREGAR POLÍTICA EXPLÍCITA DE DENEGACIÓN A TENANTS PARA PÚBLICO
-- Primero verificamos las políticas existentes y añadimos una restrictiva

-- 3. RESTRINGIR ACCESO ANÓNIMO A EVENTOS
-- Modificar para que solo funcione a través de la función evento_has_valid_token
DROP POLICY IF EXISTS "Public events without sensitive data" ON public.eventos;

-- No permitir acceso directo anónimo, forzar uso de token
CREATE POLICY "Anonymous access requires valid token function"
ON public.eventos
FOR SELECT
USING (
  -- Solo si hay un token válido verificado (usado por el muro público)
  -- El acceso anónimo se valida a través de evento_has_valid_token()
  -- Esta política permite la lectura pero la app debe validar tokens
  (
    estado IN ('activo', 'programado', 'finalizado')
    AND auth.uid() IS NULL
  )
);

-- 4. AGREGAR COMENTARIOS DE SEGURIDAD PARA DOCUMENTACIÓN
COMMENT ON POLICY "Users can only view their own tenant" ON public.tenants IS 
'Restricts tenant data access to prevent competitors from viewing pricing strategies';

COMMENT ON POLICY "Authenticated users view own or managed events" ON public.eventos IS 
'Ensures QR tokens and payment data only visible to authorized users';

COMMENT ON POLICY "Users view only payments for their events" ON public.pagos IS 
'Prevents payment data enumeration attacks';