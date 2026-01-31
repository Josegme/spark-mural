-- =====================================================
-- CORRECCIÓN DE WARNINGS: Políticas INSERT más restrictivas
-- =====================================================

-- 1. CONTENIDO: Restringir INSERT a eventos válidos solamente
DROP POLICY IF EXISTS "Anyone can insert content" ON public.contenido;

CREATE POLICY "Insert content only for active events"
ON public.contenido
FOR INSERT
WITH CHECK (
  -- Solo permite insertar si el evento existe y está activo
  EXISTS (
    SELECT 1 FROM public.eventos 
    WHERE id = evento_id 
    AND estado IN ('activo', 'programado')
  )
);

-- 2. LIKES: Restringir INSERT a contenido aprobado solamente
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.likes;

CREATE POLICY "Insert likes only for approved content"
ON public.likes
FOR INSERT
WITH CHECK (
  -- Solo permite dar like a contenido aprobado
  EXISTS (
    SELECT 1 FROM public.contenido 
    WHERE id = contenido_id 
    AND aprobado = true
  )
);

-- 3. LOGS_AUDITORIA: Restringir INSERT solo desde funciones del sistema
-- Este INSERT público es necesario para el logging, pero podemos hacerlo más seguro
DROP POLICY IF EXISTS "System can insert logs" ON public.logs_auditoria;

CREATE POLICY "Authenticated users can insert logs"
ON public.logs_auditoria
FOR INSERT
WITH CHECK (
  -- Solo usuarios autenticados pueden generar logs (o el sistema via service role)
  auth.uid() IS NOT NULL OR auth.role() = 'service_role'
);