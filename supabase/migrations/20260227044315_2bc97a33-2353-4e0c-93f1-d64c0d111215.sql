
-- Table for game configurations (up to 3 per event)
CREATE TABLE public.juegos_evento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT 'Juego',
  cantidad_fotos INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_fotos BETWEEN 1 AND 4),
  regla TEXT NOT NULL DEFAULT '',
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for active game state (only one active game per event at a time)
CREATE TABLE public.juego_activo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  juego_id UUID NOT NULL REFERENCES public.juegos_evento(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'girando' CHECK (estado IN ('girando', 'revelado', 'cerrado')),
  fotos_seleccionadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for juegos_evento
ALTER TABLE public.juegos_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owner can manage games" ON public.juegos_evento
  FOR ALL USING (
    evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid())
  ) WITH CHECK (
    evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid())
  );

CREATE POLICY "Super admin can manage all games" ON public.juegos_evento
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Public read for wall display (anonymous guests need to see game config)
CREATE POLICY "Public read games for active events" ON public.juegos_evento
  FOR SELECT USING (
    evento_id IN (SELECT id FROM eventos WHERE estado IN ('activo', 'pausado', 'programado'))
  );

-- RLS for juego_activo
ALTER TABLE public.juego_activo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owner can manage active game" ON public.juego_activo
  FOR ALL USING (
    evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid())
  ) WITH CHECK (
    evento_id IN (SELECT id FROM eventos WHERE cliente_user_id = auth.uid())
  );

CREATE POLICY "Super admin can manage active games" ON public.juego_activo
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Public read for wall display
CREATE POLICY "Public read active game" ON public.juego_activo
  FOR SELECT USING (
    evento_id IN (SELECT id FROM eventos WHERE estado IN ('activo', 'pausado', 'programado'))
  );

-- Enable realtime for juego_activo so the wall reacts instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.juego_activo;

-- Index for fast lookups
CREATE INDEX idx_juegos_evento_evento_id ON public.juegos_evento(evento_id);
CREATE INDEX idx_juego_activo_evento_id ON public.juego_activo(evento_id);
