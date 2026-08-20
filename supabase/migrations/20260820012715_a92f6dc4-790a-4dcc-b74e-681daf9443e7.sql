
CREATE OR REPLACE FUNCTION public.safe_uuid(_txt text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN _txt::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_evento(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_uuid(text) TO anon, authenticated;
