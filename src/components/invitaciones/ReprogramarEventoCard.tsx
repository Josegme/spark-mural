/**
 * Reprogramar fecha del evento y avisar por email a los invitados confirmados
 */
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarClock, Mail, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  eventoId: string;
  nombre: string;
  fechaEvento: string;
  horaInicio: string;
  fechaLimiteRsvp: string | null;
  invitados: { nombre: string; email: string | null; estado: string }[];
}

const fmt = (f: string) =>
  f ? new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

export function ReprogramarEventoCard({ eventoId, nombre, fechaEvento, horaInicio, fechaLimiteRsvp, invitados }: Props) {
  const qc = useQueryClient();
  const [fecha, setFecha] = useState(fechaEvento);
  const [hora, setHora] = useState(horaInicio?.slice(0, 5) || '');
  const [guardando, setGuardando] = useState(false);
  const [asunto, setAsunto] = useState(`Cambio de fecha: ${nombre}`);
  const [mensaje, setMensaje] = useState('');
  const [incluirQr, setIncluirQr] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { setFecha(fechaEvento); setHora(horaInicio?.slice(0, 5) || ''); }, [fechaEvento, horaInicio]);
  useEffect(() => {
    setMensaje(`Te escribimos para avisarte que "${nombre}" fue reprogramado para el ${fmt(fechaEvento)} a las ${horaInicio?.slice(0, 5)} hs.\n\nTu confirmación sigue vigente. ¡Te esperamos!`);
  }, [nombre, fechaEvento, horaInicio]);

  const confirmados = invitados.filter((i) => i.estado === 'confirmado');
  const conEmail = confirmados.filter((i) => i.email);
  const sinEmail = confirmados.filter((i) => !i.email);
  const cambio = fecha !== fechaEvento || hora !== horaInicio?.slice(0, 5);

  const guardarFecha = async () => {
    if (!fecha || !hora) return toast.error('Completá fecha y hora');
    if (fechaLimiteRsvp && new Date(fechaLimiteRsvp) > new Date(`${fecha}T${hora}`)) {
      return toast.error('La fecha límite para confirmar quedaría después del evento. Ajustala primero en la configuración de invitaciones.');
    }
    setGuardando(true);
    const { error } = await supabase.from('eventos').update({ fecha_evento: fecha, hora_inicio: hora }).eq('id', eventoId);
    setGuardando(false);
    if (error) return toast.error('No se pudo cambiar la fecha');
    toast.success('Fecha actualizada. La invitación pública ya muestra la nueva fecha.');
    qc.invalidateQueries({ queryKey: ['event-details', eventoId] });
  };

  const enviar = async () => {
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('notificar-cambio-fecha', {
      body: { evento_id: eventoId, asunto, mensaje, incluir_qr: incluirQr },
    });
    setEnviando(false); setConfirmOpen(false);
    if (error || !data?.success) return toast.error(data?.error || 'No se pudo enviar el aviso');
    if (data.fallidos?.length) toast.warning(`Enviados: ${data.enviados}. Fallaron: ${data.fallidos.join(', ')}`);
    else toast.success(`Aviso enviado a ${data.enviados} invitado(s)`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-warning" />
          <CardTitle className="text-lg">Reprogramar y avisar a invitados</CardTitle>
        </div>
        <CardDescription>Cambiá la fecha del evento y avisá por email a quienes ya confirmaron.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium">1. Nueva fecha</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Hora</Label><Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
            <Button onClick={guardarFecha} disabled={!cambio || guardando}>
              {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Guardar fecha
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Fecha actual: {fmt(fechaEvento)} · {horaInicio?.slice(0, 5)} hs</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">2. Aviso por email</p>
          <div className="space-y-1"><Label>Asunto</Label><Input value={asunto} maxLength={200} onChange={(e) => setAsunto(e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Mensaje</Label>
            <Textarea rows={5} value={mensaje} maxLength={3000} onChange={(e) => setMensaje(e.target.value)} />
            <p className="text-xs text-muted-foreground">El email también muestra la nueva fecha y hora guardadas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={incluirQr} onCheckedChange={setIncluirQr} id="incluir-qr" />
            <Label htmlFor="incluir-qr">Incluir el QR de ingreso de cada invitado</Label>
          </div>
          {cambio && <p className="text-xs text-warning">Guardá la nueva fecha antes de enviar el aviso.</p>}
          <Button onClick={() => setConfirmOpen(true)} disabled={!conEmail.length || cambio || !asunto.trim() || !mensaje.trim()} className="w-full sm:w-auto">
            <Mail className="w-4 h-4 mr-2" /> Enviar a {conEmail.length} confirmado(s) con email
          </Button>
          {sinEmail.length > 0 && (
            <div className="text-xs text-muted-foreground rounded-md border p-3">
              <p className="font-medium mb-1">Sin email ({sinEmail.length}) — avisales por WhatsApp:</p>
              <p>{sinEmail.map((i) => i.nombre).join(', ')}</p>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar el aviso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un email a {conEmail.length} invitado(s) con la fecha {fmt(fechaEvento)} a las {horaInicio?.slice(0, 5)} hs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); enviar(); }} disabled={enviando}>
              {enviando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
