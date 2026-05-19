
-- Tabla de plantilla de certificado por evento
CREATE TABLE public.certificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'participacion',
  plantilla TEXT NOT NULL DEFAULT 'moderna',
  orientacion TEXT NOT NULL DEFAULT 'horizontal',
  titulo TEXT NOT NULL DEFAULT 'Certificado de Participación',
  texto_principal TEXT NOT NULL DEFAULT 'Se otorga el presente certificado a {nombre} por su participación en {evento} realizado el {fecha}.',
  texto_secundario TEXT,
  organizador TEXT,
  lugar TEXT,
  logo_principal_url TEXT,
  logo_secundario_url TEXT,
  firmas JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_primario TEXT NOT NULL DEFAULT '#4c1d95',
  color_secundario TEXT NOT NULL DEFAULT '#ec4899',
  tipografia TEXT NOT NULL DEFAULT 'sans',
  fondo_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificados_evento ON public.certificados(evento_id);

ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage certificados"
ON public.certificados FOR ALL
USING (
  is_super_admin(auth.uid())
  OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
);

CREATE POLICY "Tenants can view certificados"
ON public.certificados FOR SELECT
USING (
  evento_id IN (
    SELECT e.id FROM public.eventos e
    WHERE e.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE TRIGGER update_certificados_updated_at
BEFORE UPDATE ON public.certificados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de certificados emitidos a invitados
CREATE TABLE public.certificados_emitidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificado_id UUID NOT NULL REFERENCES public.certificados(id) ON DELETE CASCADE,
  evento_id UUID NOT NULL,
  invitacion_id UUID,
  nombre_destinatario TEXT NOT NULL,
  email_destinatario TEXT,
  codigo_verificacion TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  enviado_email BOOLEAN NOT NULL DEFAULT false,
  enviado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cert_emitidos_evento ON public.certificados_emitidos(evento_id);
CREATE INDEX idx_cert_emitidos_certificado ON public.certificados_emitidos(certificado_id);
CREATE INDEX idx_cert_emitidos_codigo ON public.certificados_emitidos(codigo_verificacion);

ALTER TABLE public.certificados_emitidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage cert emitidos"
ON public.certificados_emitidos FOR ALL
USING (
  is_super_admin(auth.uid())
  OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR evento_id IN (SELECT id FROM public.eventos WHERE cliente_user_id = auth.uid())
);

CREATE POLICY "Tenants can view cert emitidos"
ON public.certificados_emitidos FOR SELECT
USING (
  evento_id IN (
    SELECT e.id FROM public.eventos e
    WHERE e.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- RPC pública de verificación (sin exponer email)
CREATE OR REPLACE FUNCTION public.get_certificado_by_codigo(_codigo TEXT)
RETURNS TABLE(
  codigo TEXT,
  nombre_destinatario TEXT,
  titulo TEXT,
  evento_nombre TEXT,
  fecha_evento DATE,
  organizador TEXT,
  emitido_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ce.codigo_verificacion,
    ce.nombre_destinatario,
    c.titulo,
    e.nombre,
    e.fecha_evento,
    c.organizador,
    ce.created_at
  FROM public.certificados_emitidos ce
  JOIN public.certificados c ON c.id = ce.certificado_id
  JOIN public.eventos e ON e.id = ce.evento_id
  WHERE ce.codigo_verificacion = _codigo
  LIMIT 1;
$$;

-- Bucket de storage para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas storage: lectura pública, escritura autenticada (dueños del evento)
CREATE POLICY "Cert assets publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados');

CREATE POLICY "Authenticated users can upload cert assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificados');

CREATE POLICY "Authenticated users can update own cert assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificados');

CREATE POLICY "Authenticated users can delete own cert assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificados');
