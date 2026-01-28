-- Add 'pausado' to the event_status enum
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pausado' AFTER 'activo';

-- Update RLS policy for public events to include pausado state (so paused events can still be viewed by owner)
-- The existing policy allows 'activo' and 'programado' for public view, which is correct
-- Paused events should NOT be publicly viewable, but owner should still see them (already covered)