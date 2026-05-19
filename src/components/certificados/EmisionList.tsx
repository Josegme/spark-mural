/**
 * Lista de emisiones con selector de audiencia, selección masiva,
 * descarga ZIP y envío masivo por email.
 */
import { useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, Mail, CheckCircle2, Send, FileArchive, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useInvitacionesAdmin } from '@/hooks/useInvitaciones';
import {
  crearCertificadoEmitido,
  enviarCertificado,
  useCertificadosEmitidos,
  type Certificado,
  type CertificadoEmitido,
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

type Audiencia = 'todos' | 'checkin' | 'manual';

export function EmisionList({ eventoId, eventoNombre, fechaEvento, certificado }: Props) {
  const { invitaciones, checkins } = useInvitacionesAdmin(eventoId);
  const { data: emitidos = [] } = useCertificadosEmitidos(eventoId);
  const [working, setWorking] = useState<string | null>(null);
  const [renderData, setRenderData] = useState<{ nombre: string; codigo: string } | null>(null);
  const [audiencia, setAudiencia] = useState<Audiencia>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState<null | 'zip' | 'email'>(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const renderRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const fechaFmt = fechaEvento
    ? new Date(fechaEvento + 'T00:00:00').toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const checkinSet = useMemo(() => new Set(checkins.map(c => c.invitacion_id)), [checkins]);
  const emitidosByInv = useMemo(() => {
    const m = new Map<string, CertificadoEmitido>();
    emitidos.forEach(e => {
      if (e.invitacion_id) m.set(e.invitacion_id, e);
    });
    return m;
  }, [emitidos]);

  const confirmados = useMemo(
    () => invitaciones.filter(i => i.estado === 'confirmado'),
    [invitaciones]
  );

  const audienciaList = useMemo(() => {
    if (audiencia === 'checkin') return confirmados.filter(i => checkinSet.has(i.id));
    return confirmados;
  }, [audiencia, confirmados, checkinSet]);

  // Cuando aplica selector "todos" o "checkin", la selección efectiva es la audiencia entera.
  const effectiveSelected = useMemo(() => {
    if (audiencia === 'manual') return audienciaList.filter(i => selected.has(i.id));
    return audienciaList;
  }, [audiencia, audienciaList, selected]);

  const conEmail = effectiveSelected.filter(i => !!i.email);

  /** Renderiza off-screen y devuelve el PDF */
  const renderPdfFor = async (nombre: string, codigo: string) => {
    setRenderData({ nombre, codigo });
    await new Promise(r => setTimeout(r, 200));
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

  /** Crea (o reusa) el registro emitido para un invitado */
  const ensureEmitido = async (
    invitacionId: string,
    nombre: string,
    email: string | null
  ): Promise<CertificadoEmitido> => {
    const existing = emitidosByInv.get(invitacionId);
    if (existing) return existing;
    return await crearCertificadoEmitido({
      certificado_id: certificado.id,
      evento_id: eventoId,
      invitacion_id: invitacionId,
      nombre_destinatario: nombre,
      email_destinatario: email,
    });
  };

  const handleEmit = async (
    invitacionId: string,
    nombre: string,
    email: string | null,
    action: 'download' | 'email'
  ) => {
    setWorking(invitacionId + action);
    try {
      const emit = await ensureEmitido(invitacionId, nombre, email);
      const { base64, blob } = await renderPdfFor(nombre, emit.codigo_verificacion);
      if (action === 'download') {
        downloadPdfBlob(blob, `certificado-${nombre.replace(/\s+/g, '_')}.pdf`);
        await enviarCertificado({ certificado_emitido_id: emit.id, pdf_base64: base64 }).catch(() => {});
        toast({ title: 'PDF descargado' });
      } else {
        if (!email) {
          toast({ title: 'Sin email', description: 'Este invitado no tiene email', variant: 'destructive' });
          return;
        }
        await enviarCertificado({ certificado_emitido_id: emit.id, pdf_base64: base64, email_to: email });
        toast({ title: 'Certificado enviado', description: email });
      }
      qc.invalidateQueries({ queryKey: ['certificados-emitidos', eventoId] });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setWorking(null);
    }
  };

  /** Descarga masiva en ZIP */
  const handleBulkZip = async () => {
    if (effectiveSelected.length === 0) {
      toast({ title: 'Sin seleccionados', variant: 'destructive' });
      return;
    }
    setBulkRunning('zip');
    setBulkProgress({ done: 0, total: effectiveSelected.length });
    const zip = new JSZip();
    let errors = 0;
    try {
      for (const inv of effectiveSelected) {
        try {
          const emit = await ensureEmitido(inv.id, inv.nombre, inv.email);
          const { base64, blob } = await renderPdfFor(inv.nombre, emit.codigo_verificacion);
          const safeName = inv.nombre.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
          zip.file(`${safeName}-${emit.codigo_verificacion}.pdf`, blob);
          // Subir en background para guardar pdf_url
          enviarCertificado({ certificado_emitido_id: emit.id, pdf_base64: base64 }).catch(() => {});
        } catch (e) {
          console.error('ZIP item error', inv.nombre, e);
          errors++;
        } finally {
          setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        }
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      saveAs(blob, `certificados-${eventoNombre.replace(/\s+/g, '_')}.zip`);
      toast({
        title: 'ZIP descargado',
        description: `${effectiveSelected.length - errors} certificados${errors ? ` · ${errors} con error` : ''}`,
      });
      qc.invalidateQueries({ queryKey: ['certificados-emitidos', eventoId] });
    } catch (e) {
      toast({ title: 'Error en ZIP', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setBulkRunning(null);
    }
  };

  /** Envío masivo por email */
  const handleBulkEmail = async () => {
    if (conEmail.length === 0) {
      toast({ title: 'Sin emails', description: 'Ningún destinatario seleccionado tiene email', variant: 'destructive' });
      return;
    }
    setBulkRunning('email');
    setBulkProgress({ done: 0, total: conEmail.length });
    let ok = 0;
    let errors = 0;
    try {
      for (const inv of conEmail) {
        try {
          const emit = await ensureEmitido(inv.id, inv.nombre, inv.email);
          const { base64 } = await renderPdfFor(inv.nombre, emit.codigo_verificacion);
          await enviarCertificado({
            certificado_emitido_id: emit.id,
            pdf_base64: base64,
            email_to: inv.email,
          });
          ok++;
        } catch (e) {
          console.error('Email bulk error', inv.nombre, e);
          errors++;
        } finally {
          setBulkProgress(p => ({ ...p, done: p.done + 1 }));
        }
      }
      toast({
        title: 'Envío masivo terminado',
        description: `${ok} enviados${errors ? ` · ${errors} con error` : ''}`,
      });
      qc.invalidateQueries({ queryKey: ['certificados-emitidos', eventoId] });
    } finally {
      setBulkRunning(null);
    }
  };

  const toggleAll = () => {
    if (selected.size === audienciaList.length) setSelected(new Set());
    else setSelected(new Set(audienciaList.map(i => i.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Emisión de certificados</CardTitle>
          <CardDescription>
            Confirmados: {confirmados.length} · Asistieron: {checkinSet.size} · Emitidos: {emitidos.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar de audiencia + acciones masivas */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-3 rounded-md bg-muted/40 border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={audiencia} onValueChange={v => setAudiencia(v as Audiencia)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los confirmados</SelectItem>
                  <SelectItem value="checkin">Solo los que asistieron</SelectItem>
                  <SelectItem value="manual">Selección manual</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {effectiveSelected.length} destinatario{effectiveSelected.length !== 1 ? 's' : ''}
                {audiencia !== 'manual' || selected.size > 0 ? ` · ${conEmail.length} con email` : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkZip}
                disabled={!!bulkRunning || effectiveSelected.length === 0}
              >
                {bulkRunning === 'zip' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <FileArchive className="w-4 h-4 mr-1" />
                )}
                Descargar ZIP
              </Button>
              <Button
                size="sm"
                onClick={handleBulkEmail}
                disabled={!!bulkRunning || conEmail.length === 0}
              >
                {bulkRunning === 'email' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Enviar por email
              </Button>
            </div>
          </div>

          {bulkRunning && (
            <div className="space-y-1">
              <Progress value={(bulkProgress.done / Math.max(1, bulkProgress.total)) * 100} />
              <div className="text-xs text-muted-foreground text-center">
                {bulkProgress.done} / {bulkProgress.total} procesados
              </div>
            </div>
          )}

          {audienciaList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {confirmados.length === 0
                ? 'Aún no hay invitados confirmados. Activá las invitaciones para empezar a recibir RSVPs.'
                : 'No hay destinatarios para esta audiencia.'}
            </p>
          ) : (
            <div className="space-y-2">
              {audiencia === 'manual' && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={selected.size === audienciaList.length && audienciaList.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span>Seleccionar todos ({audienciaList.length})</span>
                </div>
              )}
              {audienciaList.map(inv => {
                const yaIngreso = checkinSet.has(inv.id);
                const emitido = emitidosByInv.get(inv.id);
                const isWorkingDl = working === inv.id + 'download';
                const isWorkingEm = working === inv.id + 'email';
                const isSelected = audiencia !== 'manual' || selected.has(inv.id);
                return (
                  <div
                    key={inv.id}
                    className={`flex items-center justify-between gap-2 p-3 border rounded-md ${
                      audiencia === 'manual' && !selected.has(inv.id) ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {audiencia === 'manual' && (
                        <Checkbox
                          checked={selected.has(inv.id)}
                          onCheckedChange={() => toggleOne(inv.id)}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{inv.nombre}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          {inv.email && <span>{inv.email}</span>}
                          {yaIngreso && (
                            <Badge variant="secondary" className="h-5 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Asistió
                            </Badge>
                          )}
                          {emitido?.enviado_email && (
                            <Badge variant="outline" className="h-5 text-[10px]">
                              <Mail className="w-3 h-3 mr-1" />
                              Enviado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmit(inv.id, inv.nombre, inv.email, 'download')}
                        disabled={!!working || !!bulkRunning}
                      >
                        {isWorkingDl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEmit(inv.id, inv.nombre, inv.email, 'email')}
                        disabled={!!working || !!bulkRunning || !inv.email}
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
