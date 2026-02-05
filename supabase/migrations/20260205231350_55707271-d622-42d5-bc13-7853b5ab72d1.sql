-- ============================================
-- SECURITY HARDENING MIGRATION - PART 4 FINAL
-- Balance entre seguridad y funcionalidad
-- ============================================

-- 1. ELIMINAR ACCESO ANÓNIMO A EVENTOS
-- El muro público usa la función evento_has_valid_token que ya valida tokens
DROP POLICY IF EXISTS "Anonymous access requires valid token function" ON public.eventos;

-- Política más restrictiva: NO permitir acceso anónimo directo
-- El muro usará un enfoque diferente (edge function o validación de token)
CREATE POLICY "Token-validated access for anonymous users"
ON public.eventos
FOR SELECT
USING (
  -- Dueño del evento
  auth.uid() = cliente_user_id
  OR
  -- Super admin
  is_super_admin(auth.uid())
  OR
  -- Tenant del evento
  tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  -- NOTA: Acceso anónimo se maneja via RPC/función con token
);

-- 2. CREAR FUNCIÓN SEGURA PARA ACCESO PÚBLICO A EVENTOS VIA TOKEN
CREATE OR REPLACE FUNCTION public.get_evento_by_token(_token text)
RETURNS TABLE (
  id uuid,
  nombre text,
  tipo text,
  fecha_evento date,
  hora_inicio time,
  duracion_horas int,
  estado text,
  es_premium boolean,
  color_banner text,
  logo_url text,
  estilo_ia text,
  tema_ia text,
  moderacion_activa boolean,
  total_fotos int,
  total_videos int,
  total_mensajes int,
  total_likes int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    e.total_likes
  FROM eventos e
  WHERE 
    (e.qr_pantalla_token = _token OR e.qr_invitados_token = _token OR e.qr_descarga_token = _token)
    AND e.estado IN ('activo', 'programado', 'finalizado')
$$;

-- 3. CREAR FUNCIÓN SEGURA PARA CONTENIDO PÚBLICO VIA EVENTO TOKEN
CREATE OR REPLACE FUNCTION public.get_contenido_by_evento_token(_evento_id uuid, _token text)
RETURNS TABLE (
  id uuid,
  evento_id uuid,
  tipo text,
  mensaje_texto text,
  url_original text,
  url_ia text,
  estado_ia text,
  likes_count int,
  invitado_nombre text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.evento_id,
    c.tipo::text,
    c.mensaje_texto,
    c.url_original,
    c.url_ia,
    c.estado_ia::text,
    c.likes_count,
    CASE WHEN c.invitado_nombre IS NOT NULL THEN LEFT(c.invitado_nombre, 1) || '***' ELSE NULL END,
    c.created_at
  FROM contenido c
  JOIN eventos e ON c.evento_id = e.id
  WHERE 
    c.evento_id = _evento_id
    AND c.aprobado = true
    AND (e.qr_pantalla_token = _token OR e.qr_invitados_token = _token)
    AND e.estado IN ('activo', 'programado', 'finalizado')
  ORDER BY c.created_at DESC
$$;

-- 4. RESTRINGIR POLÍTICA DE CONTENIDO
DROP POLICY IF EXISTS "Public can view approved content via token" ON public.contenido;

CREATE POLICY "Approved content viewable with proper access"
ON public.contenido
FOR SELECT
USING (
  -- Dueño del evento
  evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid())
  OR
  -- Super admin
  is_super_admin(auth.uid())
  OR
  -- Tenant del evento
  evento_id IN (
    SELECT e.id FROM eventos e 
    WHERE e.tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
  -- NOTA: Acceso público se maneja via función get_contenido_by_evento_token
);

-- 5. AGREGAR POLÍTICAS DE SEGURIDAD PARA VISTAS
-- Las vistas con security_invoker=on heredan las políticas de las tablas base

-- 6. MARCAR PRECIOS COMO INFORMACIÓN PÚBLICA INTENCIONAL (es necesario para landing)
COMMENT ON POLICY "Lectura pública de configuración de precios" ON public.configuracion_global IS 
'INTENCIONAL: Los precios son públicos para mostrar en landing page y marketing. No contiene información confidencial.';