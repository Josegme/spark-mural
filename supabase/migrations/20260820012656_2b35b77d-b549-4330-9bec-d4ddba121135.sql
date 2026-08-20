
-- Helper: ownership check for evento-scoped storage objects
CREATE OR REPLACE FUNCTION public.user_owns_evento(_evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.eventos e WHERE e.id = _evento_id AND e.cliente_user_id = auth.uid())
  )
$$;

-- Helper: safe uuid cast for storage folder names
CREATE OR REPLACE FUNCTION public.safe_uuid(_txt text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN _txt::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- ===== certificados bucket: scope writes to the owning event =====
DROP POLICY IF EXISTS "Authenticated users can upload cert assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own cert assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own cert assets" ON storage.objects;

CREATE POLICY "Cert assets insert by event owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificados'
  AND public.user_owns_evento(public.safe_uuid((storage.foldername(name))[2]))
);

CREATE POLICY "Cert assets update by event owner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'certificados'
  AND public.user_owns_evento(public.safe_uuid((storage.foldername(name))[2]))
)
WITH CHECK (
  bucket_id = 'certificados'
  AND public.user_owns_evento(public.safe_uuid((storage.foldername(name))[2]))
);

CREATE POLICY "Cert assets delete by event owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certificados'
  AND public.user_owns_evento(public.safe_uuid((storage.foldername(name))[2]))
);

-- ===== contenido-eventos bucket: only into folders of events accepting uploads =====
DROP POLICY IF EXISTS "Anyone can upload content" ON storage.objects;

CREATE POLICY "Upload content only to active events"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'contenido-eventos'
  AND public.safe_uuid((storage.foldername(name))[1]) IS NOT NULL
  AND public.event_accepts_uploads(public.safe_uuid((storage.foldername(name))[1]))
);

-- ===== revoke EXECUTE on internal-only SECURITY DEFINER functions =====
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_owns_evento(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validar_checkin(text, text, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.validar_checkin(text, text, uuid) TO authenticated;
