-- Deshabilitar temporalmente el trigger de privilegios para limpiar huérfanos
ALTER TABLE public.profiles DISABLE TRIGGER USER;

UPDATE public.profiles 
SET tenant_id = NULL, updated_at = now() 
WHERE tenant_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = profiles.tenant_id);

ALTER TABLE public.profiles ENABLE TRIGGER USER;

INSERT INTO public.logs_auditoria (accion, tabla_afectada, registro_id, detalles)
VALUES (
  'orphan_tenant_cleanup',
  'profiles',
  'bulk',
  '{"reason": "tenant_id pointed to non-existent tenant", "cleaned_at": "auto"}'::jsonb
);