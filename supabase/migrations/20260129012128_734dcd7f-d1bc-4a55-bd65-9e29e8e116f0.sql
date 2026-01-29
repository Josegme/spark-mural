-- Add courtesy event tracking fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS eventos_cortesia_disponibles integer DEFAULT 2 NOT NULL,
ADD COLUMN IF NOT EXISTS eventos_vendidos_total integer DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.eventos_cortesia_disponibles IS 'Número de eventos de cortesía disponibles para el asistente (se desbloquean 2 cada 30 ventas)';
COMMENT ON COLUMN public.tenants.eventos_vendidos_total IS 'Contador total de eventos vendidos (pagados) por el asistente';