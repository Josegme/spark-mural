
-- PROBLEMA 1: Crear función SECURITY DEFINER para que usuarios anónimos puedan verificar si un evento acepta uploads
CREATE OR REPLACE FUNCTION public.event_accepts_uploads(_evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eventos
    WHERE id = _evento_id
    AND estado IN ('activo', 'programado')
  )
$$;

-- Reemplazar la política INSERT de contenido para usar la función (sin subquery directo a eventos)
DROP POLICY IF EXISTS "Insert content for active events with validation" ON public.contenido;

CREATE POLICY "Insert content for active events with validation"
ON public.contenido
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_accepts_uploads(evento_id)
  AND (
    (tipo = 'mensaje' AND mensaje_texto IS NOT NULL AND length(mensaje_texto) > 0)
    OR (tipo IN ('foto', 'video') AND url_original IS NOT NULL)
  )
);

-- PROBLEMA 2: Insertar suscripción activa para Salón Las Rosas (plan Starter, vence en 30 días)
INSERT INTO public.suscripciones (salon_id, plan_id, precio_mensual, fecha_vencimiento, fecha_proximo_pago, estado)
VALUES (
  '880d36cd-3229-4113-95a6-d3a22ce8eb33',
  '7c48a373-88ce-4d7a-838f-c786f870ecba',
  20000,
  now() + interval '30 days',
  now() + interval '30 days',
  'activo'
);
