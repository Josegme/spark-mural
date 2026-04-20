-- FASE 1: Cerrar privilege escalation en profiles

-- 1) Reemplazar política UPDATE con WITH CHECK estricto
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND rol = (SELECT p.rol FROM public.profiles p WHERE p.id = auth.uid())
  AND tenant_id IS NOT DISTINCT FROM (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2) Trigger BEFORE UPDATE como defensa en profundidad
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir cambios totales si quien ejecuta es super_admin (vía user_roles o profiles)
  IF public.has_role(auth.uid(), 'super_admin'::app_role)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'super_admin'::user_role)
  THEN
    RETURN NEW;
  END IF;

  -- Permitir cambios desde service_role (edge functions con SUPABASE_SERVICE_ROLE_KEY)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Bloquear modificación de campos sensibles para usuarios normales
  IF NEW.rol IS DISTINCT FROM OLD.rol THEN
    RAISE EXCEPTION 'No tenés permisos para modificar el rol del perfil';
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'No tenés permisos para modificar el tenant del perfil';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'No tenés permisos para modificar el email del perfil';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;

CREATE TRIGGER prevent_profile_privilege_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();