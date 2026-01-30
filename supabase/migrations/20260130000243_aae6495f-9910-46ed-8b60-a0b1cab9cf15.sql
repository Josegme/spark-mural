-- ============================================
-- MIGRACIÓN: Sistema de gestión flexible de Tenants
-- ============================================

-- 1. Agregar columnas de flexibilidad a tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS usuario_asignado_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS puede_modificar_precios boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_evento_basico integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS precio_evento_premium integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS eventos_ilimitados boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS duracion_suscripcion_meses integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notas_trato text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_contacto text DEFAULT NULL;

-- 2. Crear tabla de configuración global (precios por defecto editables)
CREATE TABLE IF NOT EXISTS public.configuracion_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave text UNIQUE NOT NULL,
  valor jsonb NOT NULL,
  descripcion text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.configuracion_global ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo Super Admin puede gestionar
CREATE POLICY "Super admin can manage global config"
ON public.configuracion_global
FOR ALL
USING (is_super_admin(auth.uid()));

-- Insertar configuración inicial de precios
INSERT INTO public.configuracion_global (clave, valor, descripcion) VALUES
('precios_eventos', '{"basico": 10000, "premium": 25000}', 'Precios por defecto para eventos individuales'),
('precios_suscripciones', '{"starter": 150000, "profesional": 250000, "ilimitado": 500000}', 'Precios por defecto para suscripciones de salones'),
('comisiones_default', '{"asistente": 50, "superadmin": 50}', 'Comisiones por defecto para asistentes'),
('limites_default', '{"eventos_mes_asistente": 30, "eventos_mes_salon": 20, "cortesias_iniciales": 2}', 'Límites por defecto para nuevos tenants'),
('contacto_empresarial', '{"whatsapp": "3764606205", "mensaje": "Hola! Quiero información sobre planes empresariales para mi salón/eventos."}', 'Datos de contacto para empresas')
ON CONFLICT (clave) DO NOTHING;

-- 3. Actualizar política de tenants para permitir lectura por asistentes de sus propios datos
CREATE POLICY "Assistants can view own tenant"
ON public.tenants
FOR SELECT
USING (id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

-- 4. Política para que Super Admin pueda actualizar profiles (asignar tenant_id y rol)
CREATE POLICY "Super admin can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- 5. Índice para búsqueda rápida de tenants sin usuario asignado
CREATE INDEX IF NOT EXISTS idx_tenants_sin_usuario ON public.tenants (id) WHERE usuario_asignado_id IS NULL;

-- 6. Función para obtener configuración global
CREATE OR REPLACE FUNCTION public.get_global_config(config_key text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT valor FROM public.configuracion_global WHERE clave = config_key
$$;