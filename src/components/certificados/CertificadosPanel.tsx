/**
 * Panel principal de certificados dentro del detalle de evento.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Award } from 'lucide-react';
import { useCertificado } from '@/hooks/useCertificados';
import { CertificadoEditor } from './CertificadoEditor';
import { EmisionList } from './EmisionList';

interface Props {
  event: {
    id: string;
    nombre: string;
    fecha_evento: string;
  };
}

export function CertificadosPanel({ event }: Props) {
  const { data: cert, isLoading } = useCertificado(event.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4 flex items-start gap-3">
          <Award className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Diseñá un certificado y emitilo para cada invitado confirmado. Podés descargarlo en PDF o enviarlo por email.
            Cada certificado incluye un código de verificación público.
          </div>
        </CardContent>
      </Card>

      <CertificadoEditor
        eventoId={event.id}
        eventoNombre={event.nombre}
        fechaEvento={event.fecha_evento}
        certificado={cert}
      />

      {cert && (
        <EmisionList
          eventoId={event.id}
          eventoNombre={event.nombre}
          fechaEvento={event.fecha_evento}
          certificado={cert}
        />
      )}
    </div>
  );
}
