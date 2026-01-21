-- Crear bucket para contenido de eventos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contenido-eventos', 'contenido-eventos', true);

-- Políticas de storage: cualquiera puede subir (invitados sin auth)
CREATE POLICY "Anyone can upload content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contenido-eventos');

-- Cualquiera puede ver contenido público
CREATE POLICY "Anyone can view content"
ON storage.objects FOR SELECT
USING (bucket_id = 'contenido-eventos');

-- Solo el dueño del evento puede eliminar
CREATE POLICY "Event owners can delete content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contenido-eventos' 
  AND EXISTS (
    SELECT 1 FROM public.eventos e
    WHERE e.cliente_user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);