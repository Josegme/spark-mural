-- ============================================
-- MIGRACIÓN: Acceso público al Muro y Subida de Contenido
-- ============================================

-- 1. Permitir acceso público a eventos activos/programados
DROP POLICY IF EXISTS "Public can view events by token" ON public.eventos;
DROP POLICY IF EXISTS "Public can view active events by token" ON public.eventos;

CREATE POLICY "Public can view active events by token"
ON public.eventos
FOR SELECT
USING (
  estado IN ('activo', 'programado')
);

-- 2. Asegurar que cualquiera pueda insertar contenido (para invitados sin auth)
DROP POLICY IF EXISTS "Anyone can insert content" ON public.contenido;

CREATE POLICY "Anyone can insert content"
ON public.contenido
FOR INSERT
WITH CHECK (true);

-- 3. Permitir ver contenido aprobado públicamente
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.contenido;

CREATE POLICY "Anyone can view approved content"
ON public.contenido
FOR SELECT
USING (aprobado = true);

-- 4. Permitir al dueño del evento ver TODO el contenido (para moderación)
DROP POLICY IF EXISTS "Event owner can view all content" ON public.contenido;

CREATE POLICY "Event owner can view all content"
ON public.contenido
FOR SELECT
USING (
  evento_id IN (
    SELECT id FROM public.eventos 
    WHERE cliente_user_id = auth.uid()
  )
);

-- 5. Permitir al dueño moderar contenido
DROP POLICY IF EXISTS "Event owner can update content" ON public.contenido;

CREATE POLICY "Event owner can update content"
ON public.contenido
FOR UPDATE
USING (
  evento_id IN (
    SELECT id FROM public.eventos 
    WHERE cliente_user_id = auth.uid()
  )
);

-- 6. Super admin puede ver todo el contenido
DROP POLICY IF EXISTS "Super admin can view all content" ON public.contenido;

CREATE POLICY "Super admin can view all content"
ON public.contenido
FOR SELECT
USING (is_super_admin(auth.uid()));

-- 7. Log de auditoría
INSERT INTO logs_auditoria (accion, tabla_afectada, detalles)
VALUES (
  'migration_rls_muro_publico',
  'eventos,contenido',
  jsonb_build_object(
    'descripcion', 'Habilitado acceso público al muro interactivo y subida de contenido',
    'fecha', NOW()
  )
);