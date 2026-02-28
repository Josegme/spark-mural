-- Fix public wall access to game state without requiring authenticated session
-- 1) Helper function evaluated as definer so it does not depend on anon visibility on eventos table
CREATE OR REPLACE FUNCTION public.can_read_public_event(_evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.eventos e
    WHERE e.id = _evento_id
      AND e.estado IN ('activo', 'pausado', 'programado')
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_read_public_event(uuid) TO anon, authenticated;

-- 2) Recreate public-read policies for wall game flow
DROP POLICY IF EXISTS "Public read active game" ON public.juego_activo;
CREATE POLICY "Public read active game"
ON public.juego_activo
FOR SELECT
TO anon, authenticated
USING (public.can_read_public_event(evento_id));

DROP POLICY IF EXISTS "Public read games for active events" ON public.juegos_evento;
CREATE POLICY "Public read games for active events"
ON public.juegos_evento
FOR SELECT
TO anon, authenticated
USING (public.can_read_public_event(evento_id));

-- 3) Ensure realtime broadcasts for active game table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'juego_activo'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.juego_activo;
  END IF;
END
$$;