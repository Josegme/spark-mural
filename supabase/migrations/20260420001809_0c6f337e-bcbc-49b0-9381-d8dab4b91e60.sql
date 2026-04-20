-- FASE 2: Migrar is_super_admin() a user_roles

-- 1) Sincronizar profiles.rol -> user_roles para todos los usuarios existentes
-- Idempotente: solo inserta si no existe ya el par (user_id, role)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.rol::text::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role::text = p.rol::text
);

-- 2) Reescribir is_super_admin para que lea exclusivamente de user_roles
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::public.app_role
  )
$$;