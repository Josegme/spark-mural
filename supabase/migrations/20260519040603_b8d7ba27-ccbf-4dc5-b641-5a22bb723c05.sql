ALTER TABLE public.certificados
ADD COLUMN IF NOT EXISTS fondo_opacidad numeric NOT NULL DEFAULT 0.3
CHECK (fondo_opacidad >= 0 AND fondo_opacidad <= 1);