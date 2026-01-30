-- Agregar política RLS de lectura pública para configuracion_global (precios eventos)
-- Esto permite que usuarios no autenticados vean los precios en la landing

CREATE POLICY "Lectura pública de configuración de precios" 
ON public.configuracion_global 
FOR SELECT 
TO anon
USING (clave IN ('precios_eventos', 'precios_suscripciones'));