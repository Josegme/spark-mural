-- =============================================
-- FASE 1: Infraestructura de Pagos Multi-Tenant
-- =============================================

-- 1. Actualizar defaults de comisiones a 50/50 para nuevos tenants
ALTER TABLE public.tenants 
  ALTER COLUMN comision_asistente SET DEFAULT 50,
  ALTER COLUMN comision_superadmin SET DEFAULT 50;

-- 2. Crear tabla para credenciales de pago por tenant
CREATE TABLE IF NOT EXISTS public.tenant_payment_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  provider payment_gateway NOT NULL,
  is_sandbox boolean DEFAULT true NOT NULL,
  credentials_encrypted text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Un tenant puede tener una credencial por pasarela y ambiente
  UNIQUE(tenant_id, provider, is_sandbox)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_payment_credentials_tenant 
  ON public.tenant_payment_credentials(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_payment_credentials_active 
  ON public.tenant_payment_credentials(tenant_id, is_active) 
  WHERE is_active = true;

-- 4. Trigger para updated_at
CREATE TRIGGER trigger_tenant_payment_credentials_updated_at
  BEFORE UPDATE ON public.tenant_payment_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE public.tenant_payment_credentials ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Tenants pueden ver sus propias credenciales
CREATE POLICY "tenant_view_own_credentials"
  ON public.tenant_payment_credentials
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Tenants pueden crear sus credenciales
CREATE POLICY "tenant_insert_own_credentials"
  ON public.tenant_payment_credentials
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Tenants pueden actualizar sus credenciales
CREATE POLICY "tenant_update_own_credentials"
  ON public.tenant_payment_credentials
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Tenants pueden eliminar sus credenciales
CREATE POLICY "tenant_delete_own_credentials"
  ON public.tenant_payment_credentials
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Super Admins pueden ver todas las credenciales
CREATE POLICY "superadmin_view_all_credentials"
  ON public.tenant_payment_credentials
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Super Admins pueden gestionar todas las credenciales
CREATE POLICY "superadmin_manage_all_credentials"
  ON public.tenant_payment_credentials
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- 7. Comentarios para documentación
COMMENT ON TABLE public.tenant_payment_credentials IS 'Almacena credenciales cifradas de Mercado Pago y Stripe por tenant';
COMMENT ON COLUMN public.tenant_payment_credentials.credentials_encrypted IS 'JSON cifrado con AES conteniendo access_token, public_key, etc.';
COMMENT ON COLUMN public.tenant_payment_credentials.is_sandbox IS 'true = credenciales de prueba, false = producción';