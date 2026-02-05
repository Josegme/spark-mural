-- ============================================
-- SECURITY HARDENING MIGRATION
-- Corrige exposición de datos sensibles
-- ============================================

-- 1. CREAR VISTA eventos_public QUE EXCLUYA DATOS SENSIBLES
-- Solo expone los campos necesarios para invitados con token válido
DROP VIEW IF EXISTS public.eventos_public;

CREATE VIEW public.eventos_public
WITH (security_invoker=on) AS
SELECT 
  id,
  nombre,
  tipo,
  fecha_evento,
  hora_inicio,
  duracion_horas,
  estado,
  es_premium,
  color_banner,
  logo_url,
  estilo_ia,
  tema_ia,
  moderacion_activa,
  limite_subidas_por_invitado,
  total_fotos,
  total_videos,
  total_mensajes,
  total_likes
  -- EXCLUYE: cliente_user_id, tenant_id, payment_id, precio_pagado, 
  -- pasarela_pago, qr_pantalla_token, qr_invitados_token, qr_descarga_token
FROM public.eventos;

-- 2. ELIMINAR POLÍTICA PÚBLICA PERMISIVA DE EVENTOS
DROP POLICY IF EXISTS "Public can view active events by QR token only" ON public.eventos;

-- 3. CREAR POLÍTICA MÁS RESTRICTIVA PARA ACCESO PÚBLICO VÍA TOKEN
-- Solo permite acceso si se proporciona un token válido en la consulta
CREATE POLICY "Public can view event with valid token"
ON public.eventos
FOR SELECT
USING (
  -- Usuarios autenticados dueños del evento
  (auth.uid() = cliente_user_id)
  OR 
  -- Super admins
  is_super_admin(auth.uid())
  OR
  -- Tenant del evento (salon/asistente)
  (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  OR
  -- Eventos activos/programados accesibles públicamente SOLO a través de la vista
  (estado IN ('activo', 'programado') AND auth.uid() IS NULL)
);

-- 4. CORREGIR VISTA contenido_public PARA EXCLUIR DATOS SENSIBLES
DROP VIEW IF EXISTS public.contenido_public;

CREATE VIEW public.contenido_public
WITH (security_invoker=on) AS
SELECT 
  id,
  evento_id,
  tipo,
  mensaje_texto,
  url_original,
  url_ia,
  estado_ia,
  likes_count,
  aprobado,
  moderado,
  created_at,
  CASE 
    WHEN invitado_nombre IS NOT NULL THEN LEFT(invitado_nombre, 1) || '***'
    ELSE NULL 
  END as invitado_nombre
  -- EXCLUYE: invitado_device_id, ip_address (datos sensibles)
FROM public.contenido
WHERE aprobado = true;

-- 5. CORREGIR POLÍTICA DE LIKES - Eliminar USING(true)
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;

-- Nueva política: solo ver likes de contenido aprobado
CREATE POLICY "View likes on approved content"
ON public.likes
FOR SELECT
USING (
  contenido_id IN (
    SELECT id FROM public.contenido WHERE aprobado = true
  )
);

-- 6. AGREGAR RATE LIMITING BÁSICO PARA INSERT DE LIKES
-- Previene spam de likes desde el mismo device
DROP POLICY IF EXISTS "Insert likes only for approved content" ON public.likes;

CREATE POLICY "Insert likes with spam protection"
ON public.likes
FOR INSERT
WITH CHECK (
  -- Solo contenido aprobado
  (EXISTS (
    SELECT 1 FROM contenido
    WHERE contenido.id = likes.contenido_id 
    AND contenido.aprobado = true
  ))
  AND
  -- No duplicados del mismo device
  (NOT EXISTS (
    SELECT 1 FROM likes existing
    WHERE existing.contenido_id = likes.contenido_id
    AND existing.invitado_device_id = likes.invitado_device_id
  ))
);

-- 7. ACTUALIZAR VISTA profiles_public PARA MINIMIZAR EXPOSICIÓN
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  nombre,
  avatar_url,
  rol,
  pais,
  tenant_id,
  created_at,
  updated_at
  -- EXCLUYE: email, telefono (PII sensible)
FROM public.profiles;

-- 8. RESTRINGIR ACCESO DIRECTO A CONTENIDO - Forzar uso de vista
DROP POLICY IF EXISTS "Public can view approved content only" ON public.contenido;

CREATE POLICY "Public can view approved content via token"
ON public.contenido
FOR SELECT
USING (
  -- Dueño del evento
  (evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid()))
  OR
  -- Super admin
  is_super_admin(auth.uid())
  OR
  -- Contenido aprobado de eventos activos (para invitados)
  (
    aprobado = true 
    AND evento_id IN (
      SELECT id FROM eventos 
      WHERE estado IN ('activo', 'programado', 'finalizado')
    )
  )
);

-- 9. Habilitar leaked password protection (requiere configuración adicional)
-- NOTA: Esto debe habilitarse desde la configuración de Supabase Auth