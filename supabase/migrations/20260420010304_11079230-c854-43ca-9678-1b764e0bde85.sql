-- Fix recursive RLS on public.user_roles
-- Root cause: the current admin policy queries public.user_roles directly,
-- which causes infinite recursion when evaluating access on the same table.

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Keep self-read access explicit and non-recursive
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO public
USING (auth.uid() = user_id);