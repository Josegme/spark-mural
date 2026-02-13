-- Consolidar 6 políticas RLS redundantes en tenant_payment_credentials a 2 claras
DROP POLICY IF EXISTS "Only super admin can delete payment credentials" ON tenant_payment_credentials;
DROP POLICY IF EXISTS "Only super admin can insert payment credentials" ON tenant_payment_credentials;
DROP POLICY IF EXISTS "Only super admin can update payment credentials" ON tenant_payment_credentials;
DROP POLICY IF EXISTS "Only super admin can view payment credentials" ON tenant_payment_credentials;
DROP POLICY IF EXISTS "superadmin_manage_all_credentials" ON tenant_payment_credentials;
DROP POLICY IF EXISTS "superadmin_view_all_credentials" ON tenant_payment_credentials;

-- Política consolidada para lectura (super admin)
CREATE POLICY "Super admin can view all payment credentials"
ON tenant_payment_credentials
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Política consolidada para modificaciones (super admin)
CREATE POLICY "Super admin can manage all payment credentials"
ON tenant_payment_credentials
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));