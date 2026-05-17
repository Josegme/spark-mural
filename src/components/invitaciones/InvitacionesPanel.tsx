/**
 * Panel admin de Invitaciones para el dueño del evento.
 * Incluye: activación + config, share modal, stats live, lista y export CSV.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Mail, QrCode, Users, CheckCircle2, ScanLine, Copy, Download, ExternalLink, Save, Loader2, Share2,
  Image as ImageIcon, Upload, Trash2,
} from 'lucide-react';
import { useInvitacionesAdmin, useActivarInvitaciones, uploadTarjetaInvitacion } from '@/hooks/useInvitaciones';
import { getCheckinUrl, getInvitacionUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { EventDetails } from '@/hooks/useEventDetails';

interface Props {
  event: EventDetails & {
    invitaciones_activas?: boolean;
    invitaciones_cupo_maximo?: number | null;
    invitaciones_acompanantes_max?: number;
    invitaciones_fecha_limite_rsvp?: string | null;
    invitaciones_mensaje?: string | null;
    invitacion_tarjeta_url?: string | null;
    invitacion_tarjeta_formato?: string | null;
    qr_invitaciones_token?: string | null;
    qr_checkin_token?: string | null;
  };
}

type TarjetaFormato = 'post' | 'historia' | 'horizontal';

const FORMATO_LABELS: Record<TarjetaFormato, { label: string; ratio: string; dims: string }> = {
  post: { label: 'Post (1:1)', ratio: 'aspect-square', dims: '1080×1080' },
  historia: { label: 'Historia / Reel (9:16)', ratio: 'aspect-[9/16]', dims: '1080×1920' },
  horizontal: { label: 'Horizontal (16:9)', ratio: 'aspect-video', dims: '1200×675' },
};

export function InvitacionesPanel({ event }: Props) {
  const { invitaciones, checkins } = useInvitacionesAdmin(event.id);
  const { mutateAsync: activar, isPending } = useActivarInvitaciones(event.id);

  const [activa, setActiva] = useState(!!event.invitaciones_activas);
  const [cupo, setCupo] = useState(event.invitaciones_cupo_maximo?.toString() || '');
  const [acomp, setAcomp] = useState(event.invitaciones_acompanantes_max?.toString() || '0');
  const [limite, setLimite] = useState(
    event.invitaciones_fecha_limite_rsvp ? event.invitaciones_fecha_limite_rsvp.slice(0, 16) : ''
  );
  const [mensaje, setMensaje] = useState(event.invitaciones_mensaje || '');
  const [tarjetaUrl, setTarjetaUrl] = useState<string | null>(event.invitacion_tarjeta_url || null);
  const [tarjetaFormato, setTarjetaFormato] = useState<TarjetaFormato>(
    (event.invitacion_tarjeta_formato as TarjetaFormato) || 'post'
  );
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    setActiva(!!event.invitaciones_activas);
    setCupo(event.invitaciones_cupo_maximo?.toString() || '');
    setAcomp(event.invitaciones_acompanantes_max?.toString() || '0');
    setLimite(event.invitaciones_fecha_limite_rsvp ? event.invitaciones_fecha_limite_rsvp.slice(0, 16) : '');
    setMensaje(event.invitaciones_mensaje || '');
    setTarjetaUrl(event.invitacion_tarjeta_url || null);
    setTarjetaFormato((event.invitacion_tarjeta_formato as TarjetaFormato) || 'post');
  }, [event.invitaciones_activas, event.invitaciones_cupo_maximo,
      event.invitaciones_acompanantes_max, event.invitaciones_fecha_limite_rsvp,
      event.invitaciones_mensaje, event.invitacion_tarjeta_url, event.invitacion_tarjeta_formato]);

  // Fin del evento (fecha + hora + duración) para validar la fecha límite de RSVP
  const eventoFin = (() => {
    if (!event.fecha_evento || !event.hora_inicio) return null;
    const d = new Date(`${event.fecha_evento}T${event.hora_inicio}`);
    if (isNaN(d.getTime())) return null;
    d.setHours(d.getHours() + (event.duracion_horas || 0));
    return d;
  })();

  const limiteDate = limite ? new Date(limite) : null;
  const cupoNum = cupo ? parseInt(cupo) : null;
  const acompNum = parseInt(acomp) || 0;

  const errores: string[] = [];
  if (activa) {
    if (limiteDate && eventoFin && limiteDate > eventoFin) {
      errores.push('La fecha límite para confirmar no puede ser posterior al fin del evento.');
    }
    if (limiteDate && limiteDate < new Date()) {
      errores.push('La fecha límite ya pasó. Elegí una fecha futura.');
    }
    if (cupoNum !== null && cupoNum < 1) {
      errores.push('El cupo máximo debe ser al menos 1 (o dejalo vacío para sin límite).');
    }
    if (acompNum < 0 || acompNum > 20) {
      errores.push('Los acompañantes deben estar entre 0 y 20.');
    }
    if (mensaje.length > 500) {
      errores.push('El mensaje no puede superar los 500 caracteres.');
    }
  }
  const tieneErrores = errores.length > 0;

  const guardar = async () => {
    if (tieneErrores) {
      toast.error(errores[0]);
      return;
    }
    try {
      await activar({
        activar: activa,
        cupo_maximo: cupoNum,
        acompanantes_max: acompNum,
        fecha_limite_rsvp: limiteDate ? limiteDate.toISOString() : null,
        mensaje: mensaje.trim() || null,
      });
      toast.success(activa ? 'Invitaciones activas' : 'Configuración guardada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  // máximo para el input datetime-local (en formato YYYY-MM-DDTHH:mm)
  const maxLimite = eventoFin
    ? new Date(eventoFin.getTime() - eventoFin.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : undefined;

  const totalConfirmados = invitaciones.filter(i => i.estado === 'confirmado').length;
  const totalPersonas = invitaciones
    .filter(i => i.estado === 'confirmado')
    .reduce((a, i) => a + 1 + i.acompanantes, 0);
  const totalIngresos = checkins.length;

  const invitacionToken = event.qr_invitaciones_token;
  const checkinToken = event.qr_checkin_token;
  const linkInvitacion = invitacionToken ? getInvitacionUrl(invitacionToken) : null;
  const linkCheckin = checkinToken ? getCheckinUrl(checkinToken) : null;

  const copiar = async (url: string, label: string) => {
    await navigator.clipboard.writeText(url);
    toast.success(`${label} copiado`);
  };

  const compartirWhatsApp = (url: string) => {
    const text = `Estás invitado a ${event.nombre}. Confirmá tu asistencia: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const exportarCSV = () => {
    const rows = [
      ['Nombre', 'Email', 'Teléfono', 'Acompañantes', 'Restricciones', 'Mensaje', 'Ingresó', 'Confirmado'],
      ...invitaciones.map(i => [
        i.nombre,
        i.email || '',
        i.telefono || '',
        String(i.acompanantes),
        i.restricciones || '',
        i.mensaje_anfitrion || '',
        checkins.some(c => c.invitacion_id === i.id) ? 'Sí' : 'No',
        i.confirmado_at ? new Date(i.confirmado_at).toLocaleString('es-AR') : '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitados-${event.nombre.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Activación */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Invitaciones digitales</CardTitle>
          </div>
          <CardDescription>
            Generá un link único para que tus invitados confirmen asistencia y reciban su QR personal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activa">Activar módulo</Label>
              <p className="text-sm text-muted-foreground">RSVP + QR personal + Check-in</p>
            </div>
            <Switch id="activa" checked={activa} onCheckedChange={setActiva} />
          </div>

          {activa && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cupo">Cupo máximo (incl. acomp.)</Label>
                  <Input id="cupo" type="number" min={0} placeholder="Sin límite"
                    value={cupo} onChange={e => setCupo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acomp">Acompañantes por invitación</Label>
                  <Input id="acomp" type="number" min={0} max={20}
                    value={acomp} onChange={e => setAcomp(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="limite">Fecha límite para confirmar</Label>
                <Input id="limite" type="datetime-local" max={maxLimite}
                  value={limite} onChange={e => setLimite(e.target.value)} />
                {eventoFin && (
                  <p className="text-xs text-muted-foreground">
                    El evento finaliza el {eventoFin.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mensaje">Mensaje en la invitación</Label>
                <Textarea id="mensaje" rows={3} maxLength={500}
                  placeholder="Te esperamos en..." value={mensaje}
                  onChange={e => setMensaje(e.target.value)} />
              </div>

              {tieneErrores && (
                <ul className="text-sm text-destructive space-y-1 bg-destructive/10 border border-destructive/30 rounded-md p-3">
                  {errores.map((er, i) => <li key={i}>• {er}</li>)}
                </ul>
              )}
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={guardar} disabled={isPending || tieneErrores}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      {activa && linkInvitacion && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Links del evento</CardTitle>
            </div>
            <CardDescription>Compartí el link de invitación con tus invitados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LinkBlock
              icon={<QrCode className="w-4 h-4" />}
              label="Link de invitación (público)"
              url={linkInvitacion}
              onCopy={() => copiar(linkInvitacion, 'Link de invitación')}
              extra={
                <Button size="sm" variant="outline" onClick={() => compartirWhatsApp(linkInvitacion)}>
                  WhatsApp
                </Button>
              }
            />
            {linkCheckin && (
              <LinkBlock
                icon={<ScanLine className="w-4 h-4" />}
                label="Link de check-in (privado — solo para vos)"
                url={linkCheckin}
                onCopy={() => copiar(linkCheckin, 'Link de check-in')}
                extra={
                  <Button size="sm" variant="outline" asChild>
                    <a href={linkCheckin} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
                    </a>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {activa && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={CheckCircle2} label="Confirmados" value={totalConfirmados} tone="text-success" />
          <StatCard icon={Users} label="Personas" value={totalPersonas} tone="text-primary" />
          <StatCard icon={ScanLine} label="Ingresaron" value={totalIngresos} tone="text-accent" />
        </div>
      )}

      {/* Lista */}
      {activa && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Invitados</CardTitle>
              <CardDescription>{invitaciones.length} confirmaciones</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={exportarCSV} disabled={!invitaciones.length}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            {invitaciones.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                Aún nadie confirmó. Compartí el link arriba 👆
              </p>
            ) : (
              <ul className="divide-y">
                {invitaciones.map(i => {
                  const ingreso = checkins.some(c => c.invitacion_id === i.id);
                  return (
                    <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {i.nombre}
                          {i.acompanantes > 0 && (
                            <span className="text-muted-foreground font-normal"> +{i.acompanantes}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {i.email || i.telefono || 'Sin contacto'}
                        </p>
                      </div>
                      {ingreso ? (
                        <Badge variant="default" className="bg-success/15 text-success border-0">
                          Ingresó
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: string;
}) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <Icon className={`w-5 h-5 mx-auto mb-1 ${tone}`} />
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function LinkBlock({ icon, label, url, onCopy, extra }: {
  icon: React.ReactNode; label: string; url: string; onCopy: () => void; extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">{icon} {label}</div>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button size="icon" variant="outline" onClick={onCopy} aria-label="Copiar">
          <Copy className="w-4 h-4" />
        </Button>
        {extra}
      </div>
    </div>
  );
}
