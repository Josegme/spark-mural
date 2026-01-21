-- Corregir RLS y seguridad para tablas faltantes

-- Habilitar RLS en tablas que faltan
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Función para verificar rol del usuario (evita recursión)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.profiles WHERE id = _user_id
$$;

-- Función para verificar si es super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND rol = 'super_admin'
  )
$$;

-- Planes: lectura pública (son datos de referencia)
CREATE POLICY "Anyone can view active plans" ON public.planes
  FOR SELECT USING (activo = true);

-- Tenants: solo super_admin puede ver todos, asistentes/salones ven el suyo
CREATE POLICY "Super admin can view all tenants" ON public.tenants
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can manage tenants" ON public.tenants
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Suscripciones: salones ven las suyas, super_admin ve todas
CREATE POLICY "Salons view own subscriptions" ON public.suscripciones
  FOR SELECT USING (
    salon_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.is_super_admin(auth.uid())
  );

-- Rendiciones: asistentes ven las suyas, super_admin ve todas
CREATE POLICY "Assistants view own renditions" ON public.rendiciones
  FOR SELECT USING (
    asistente_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.is_super_admin(auth.uid())
  );

-- Pagos: clientes ven los de sus eventos, super_admin ve todos
CREATE POLICY "Users view own payments" ON public.pagos
  FOR SELECT USING (
    evento_id IN (
      SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid()
    ) OR public.is_super_admin(auth.uid())
  );

-- Logs: solo super_admin puede ver
CREATE POLICY "Only super admin can view logs" ON public.logs_auditoria
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Permitir insertar logs desde el sistema
CREATE POLICY "System can insert logs" ON public.logs_auditoria
  FOR INSERT WITH CHECK (true);

-- Profiles: permitir insert para nuevos usuarios
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Eventos: permitir ver por QR token (para muro público)
CREATE POLICY "Public can view events by token" ON public.eventos
  FOR SELECT USING (true);

-- Actualizar función updated_at con search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;