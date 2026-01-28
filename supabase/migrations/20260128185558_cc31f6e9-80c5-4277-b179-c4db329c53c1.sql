-- ============================================
-- PICKEVENT - Migración de Seguridad y Funcionalidades Post-Lanzamiento
-- ============================================

-- 1. CREAR ENUM app_role PARA SISTEMA RBAC
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'asistente', 'salon', 'cliente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. CREAR TABLA user_roles (Sistema RBAC Seguro)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

-- 3. CREAR FUNCIONES SECURITY DEFINER PARA RBAC
-- ============================================

-- Función has_role: Verifica si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función is_admin: Verifica si un usuario es super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- 4. MIGRAR ROLES EXISTENTES DE profiles A user_roles
-- ============================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, rol::text::public.app_role
FROM public.profiles
WHERE rol IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. AGREGAR NUEVOS ESTILOS DE IA AL ENUM
-- ============================================
ALTER TYPE public.ia_style ADD VALUE IF NOT EXISTS 'anime' AFTER 'fantasia';
ALTER TYPE public.ia_style ADD VALUE IF NOT EXISTS 'vintage' AFTER 'anime';
ALTER TYPE public.ia_style ADD VALUE IF NOT EXISTS 'acuarela' AFTER 'vintage';
ALTER TYPE public.ia_style ADD VALUE IF NOT EXISTS 'neon' AFTER 'acuarela';
ALTER TYPE public.ia_style ADD VALUE IF NOT EXISTS 'minimalista' AFTER 'neon';

-- 6. ACTUALIZAR PLANES PARA SUSCRIPCIONES POR CANTIDAD
-- ============================================
-- Actualizar o insertar planes: 10, 20, ilimitados eventos
INSERT INTO public.planes (id, nombre, precio_sugerido, limite_eventos_mes, descripcion, activo)
VALUES 
  (gen_random_uuid(), 'Starter', 20000, 10, 'Ideal para salones pequeños - 10 eventos/mes', true),
  (gen_random_uuid(), 'Profesional', 40000, 20, 'Para salones con demanda media - 20 eventos/mes', true),
  (gen_random_uuid(), 'Ilimitado', 80000, -1, 'Sin límites - Eventos ilimitados', true)
ON CONFLICT DO NOTHING;

-- 7. CREAR VISTAS PÚBLICAS SIN DATOS SENSIBLES
-- ============================================

-- Vista de perfiles sin email ni teléfono
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  nombre,
  avatar_url,
  rol,
  tenant_id,
  pais,
  created_at,
  updated_at
FROM public.profiles;

-- Vista de pagos sin montos (solo para consultas públicas)
CREATE OR REPLACE VIEW public.pagos_summary
WITH (security_invoker = on) AS
SELECT 
  id,
  evento_id,
  tipo,
  pasarela,
  estado,
  created_at
FROM public.pagos;

-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 9. TABLA PARA SPLIT DE COMISIONES (Mercado Pago Marketplace)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comisiones_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  porcentaje_asistente integer NOT NULL DEFAULT 50 CHECK (porcentaje_asistente >= 0 AND porcentaje_asistente <= 100),
  porcentaje_superadmin integer NOT NULL DEFAULT 50 CHECK (porcentaje_superadmin >= 0 AND porcentaje_superadmin <= 100),
  mp_marketplace_id text, -- ID del marketplace de MP del asistente
  mp_application_id text, -- Application ID para split
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_porcentajes CHECK (porcentaje_asistente + porcentaje_superadmin = 100),
  UNIQUE(tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.comisiones_config ENABLE ROW LEVEL SECURITY;

-- Políticas para comisiones_config
CREATE POLICY "Super admins can manage commissions" ON public.comisiones_config
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenants can view own commission config" ON public.comisiones_config
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_comisiones_config_updated_at
BEFORE UPDATE ON public.comisiones_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();