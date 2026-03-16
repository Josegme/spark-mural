CREATE POLICY "Asistentes can view payments for tenant events"
ON public.pagos
FOR SELECT
TO authenticated
USING (
  evento_id IN (
    SELECT e.id FROM eventos e
    WHERE e.tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  )
);