/**
 * Lista de emisiones: muestra invitados y permite generar/enviar certificados.
 */
import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Mail, CheckCircle2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useInvitacionesAdmin } from '@/hooks/useInvitaciones';
import {
  crearCertificadoEmitido,
  enviarCertificado,
  useCertificadosEmitidos,
  type Certificado,
} from '@/hooks/useCertificados';
import { useQueryClient } from '@tanstack/react-query';
import { CertificadoPreview } from './CertificadoPreview';
import { generarCertificadoPDF, downloadPdfBlob } from './pdfUtils';

interface Props {
  eventoId: string;
  eventoNombre: string;
  fechaEvento: string;
  certificado: Certificado;
}

export function EmisionList({ eventoId, eventoNombre, fechaEvento, certificado }: Props) {
  const { invitaciones, checkins } = useInvitacionesAdmin(eventoId);
  const { data: emitidos = [] } = useCertificadosEmitidos(eventoId);
  const [working, setWorking] = useState<string | null>(null);
  const [renderData, setRenderData] = useState<{ nombre: string; codigo: string } | null>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const fechaFmt = fechaEvento
    ? new Date(fechaEvento + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const checkinSet = new Set(checkins.map(c => c.invitacion_id));
  const emitidosByInv = new Map<string, typeof emitidos[0]>();
  emitidos.forEach(e => {
    if (e.invitacion_id) emitidosByInv.set(e.invitacion_id, e);
  });

  /** Renderiza el certificado off-screen y devuelve el PDF base64 */
  const renderPdfFor = async (nombre: string, codigo: string) => {
    setRenderData({ nombre, codigo });
    await new Promise(r => setTimeout(r, 250)); // wait for DOM
    // Esperar a que las imágenes carguen
    if (renderRef.current) {
      const imgs = Array.from(renderRef.current.querySelectorAll('img'));
      await Promise.all(
        imgs.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(res => {
                img.onload = img.onerror = () => res(null);
              })
        )
      );
    }
    if (!renderRef.current) throw new Error('No render');
    const result = await generarCertificadoPDF(renderRef.current, certificado.orientacion);
    setRenderData(null);
    return result;
  };

  const handleEmit = async (
    invitacionId: string,
    nombre: string,
    email: string | null,
    action: 'download' | 'email'
  ) => {
    setWorking(invitacionId + action);
    try {
      // 1. Crear o reusar registro emitido
      let emit = emitidosByInv.get(invitacionId);
      if (!emit) {
        emit = await crearCertificadoEmitido({
          certificado_id: certificado.id,
          evento_id: eventoId,
          invitacion_id: invitacionId,
          nombre_destinatario: nombre,
          email_destinatario: email,
        });
      }

      // 2. Generar PDF
      const { base64, blob } = await renderPdfFor(nombre, emit.codigo_verificacion);

      // 3. Acción
      if (action === 'download') {
        downloadPdfBlob(blob, `certificado-${nombre.replace(/\s+/g, '_')}.pdf`);
        // igual subimos a storage en background
        await enviarCertificado({ certificado_emitido_id: emit.id, pdf_base64: base64 }).catch(() => {});
        toast({ title: 'PDF descargado' });
      } else {
        if (!email) {
          toast({ title: 'Sin email', description: 'Este invitado no tiene email registrado', variant: 'destructive' });
          return;
        }
        await enviarCertificado({ certificado_emitido_id: emit.id, pdf_base64: base64, email_to: email });
        toast({ title: 'Certificado enviado por email', description: email });
      }
      qc.invalidateQueries({ queryKey: ['certificados-emitidos', eventoId] });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setWorking(null);
    }
  };

  const confirmados = invitaciones.filter(i => i.estado === 'confirmado');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Emisión de certificados</CardTitle>
          <CardDescription>
            Invitados confirmados: {confirmados.length} · Hicieron check-in: {checkinSet.size} · Emitidos: {emitidos.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay invitados confirmados. Activá las invitaciones para empezar a recibir RSVPs.
            </p>
          ) : (
            <div className="space-y-2">
              {confirmados.map(inv => {
                const yaIngreso = checkinSet.has(inv.id);
                const emitido = emitidosByInv.get(inv.id);
                const isWorkingDl = working === inv.id + 'download';
                const isWorkingEm = working === inv.id + 'email';
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-2 p-3 border rounded-md">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{inv.nombre}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {inv.email && <span>{inv.email}</span>}
                        {yaIngreso && <Badge variant="secondary" className="h-5 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Asistió</Badge>}
                        {emitido?.enviado_email && <Badge variant="outline" className="h-5 text-[10px]"><Mail className="w-3 h-3 mr-1" />Enviado</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmit(inv.id, inv.nombre, inv.email, 'download')}
                        disabled={!!working}
                      >
                        {isWorkingDl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEmit(inv.id, inv.nombre, inv.email, 'email')}
                        disabled={!!working || !inv.email}
                        title={!inv.email ? 'Sin email' : 'Enviar por email'}
                      >
                        {isWorkingEm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render off-screen para generar PDF */}
      {renderData && (
        <div style={{ position: 'fixed', left: -99999, top: 0, opacity: 0, pointerEvents: 'none' }}>
          <div style={{ transform: 'none' }}>
            <CertificadoPreview
              ref={renderRef}
              cert={certificado}
              nombre={renderData.nombre}
              evento={eventoNombre}
              fecha={fechaFmt}
              codigo={renderData.codigo}
              verifyUrl={`${window.location.origin}/certificado/${renderData.codigo}`}
            />
          </div>
        </div>
      )}
    </>
  );
}
