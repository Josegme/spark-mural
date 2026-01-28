-- Allow salon users to view their own tenant
CREATE POLICY "Salons can view own tenant"
ON public.tenants
FOR SELECT
USING (id IN (
  SELECT tenant_id FROM profiles WHERE profiles.id = auth.uid()
));