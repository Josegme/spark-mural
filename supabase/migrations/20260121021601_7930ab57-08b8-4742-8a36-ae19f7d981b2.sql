-- Agregar política para que super_admin pueda ver todos los profiles
CREATE POLICY "Super admin can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Agregar política para que super_admin pueda ver todos los eventos
CREATE POLICY "Super admin can view all events"
ON public.eventos
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Agregar política para que super_admin pueda actualizar cualquier evento
CREATE POLICY "Super admin can update all events"
ON public.eventos
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Crear algunos tenants de prueba para verificar el panel
INSERT INTO public.tenants (nombre, email, tipo, pais, estado, comision_asistente, comision_superadmin, limite_eventos_mes)
VALUES 
  ('Eventos Premium BA', 'eventos.premium@test.com', 'asistente', 'Argentina', 'activo', 70, 30, 50),
  ('Salón Las Rosas', 'lasrosas@test.com', 'salon', 'Argentina', 'activo', NULL, NULL, 20),
  ('Party Planner Mx', 'party.mx@test.com', 'asistente', 'México', 'activo', 65, 35, 30);