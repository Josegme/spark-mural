/**
 * Página pública de verificación de certificado por código.
 */
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Award, ArrowLeft } from 'lucide-react';
import { useCertificadoPublico } from '@/hooks/useCertificados';

export default function CertificadoVerificacionPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: cert, isLoading, error } = useCertificadoPublico(codigo);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-12">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> PickEvent
        </Link>

        <Card>
          <CardContent className="py-10 px-6 text-center space-y-6">
            <Award className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Verificación de certificado</h1>

            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (error || !cert) && (
              <div className="space-y-3">
                <XCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="text-lg font-medium">Certificado no encontrado</p>
                <p className="text-sm text-muted-foreground">
                  El código <code className="font-mono">{codigo}</code> no corresponde a ningún certificado válido.
                </p>
              </div>
            )}

            {!isLoading && cert && (
              <div className="space-y-4">
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Certificado válido
                </Badge>

                <div className="border-t pt-6 space-y-3 text-left">
                  <Field label="Otorgado a" value={cert.nombre_destinatario} />
                  <Field label="Certificado" value={cert.titulo} />
                  <Field label="Evento" value={cert.evento_nombre} />
                  <Field
                    label="Fecha del evento"
                    value={new Date(cert.fecha_evento + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                  {cert.organizador && <Field label="Organizador" value={cert.organizador} />}
                  <Field
                    label="Emitido el"
                    value={new Date(cert.emitido_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                  <Field label="Código de verificación" value={cert.codigo} mono />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Verificado por PickEvent
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-base ${mono ? 'font-mono' : 'font-medium'}`}>{value}</div>
    </div>
  );
}
