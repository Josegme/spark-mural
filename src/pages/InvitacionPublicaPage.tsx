/**
 * Página pública de invitación digital — RSVP
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Calendar, Clock, Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInvitacionPublica, useCrearRSVP } from '@/hooks/useInvitaciones';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

const rsvpSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre muy corto').max(100, 'Máximo 100'),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  acompanantes: z.number().int().min(0).max(20),
  restricciones: z.string().trim().max(300).optional().or(z.literal('')),
  mensaje: z.string().trim().max(500).optional().or(z.literal('')),
});

export default function InvitacionPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: evento, isLoading, error } = useInvitacionPublica(token);
  const { mutateAsync: crearRSVP, isPending } = useCrearRSVP();

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', acompanantes: 0, restricciones: '', mensaje: '',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-display font-semibold">Invitación no disponible</h1>
            <p className="text-sm text-muted-foreground">
              Este link puede haber expirado o no estar activo.
            </p>
            <Button asChild variant="outline"><Link to="/">Volver al inicio</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cupoAgotado = evento.cupo_restante !== null && evento.cupo_restante <= 0;
  const cerrado = evento.fecha_limite_rsvp && new Date(evento.fecha_limite_rsvp) < new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = rsvpSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data.acompanantes > evento.acompanantes_max) {
      toast.error(`Máximo ${evento.acompanantes_max} acompañantes`);
      return;
    }
    try {
      const d = parsed.data;
      const qrToken = await crearRSVP({
        token: token!,
        nombre: d.nombre,
        email: d.email || undefined,
        telefono: d.telefono || undefined,
        acompanantes: d.acompanantes,
        restricciones: d.restricciones || undefined,
        mensaje: d.mensaje || undefined,
      });
      navigate(`/mi-invitacion/${qrToken}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo confirmar');
    }
  };

  const bannerColor = evento.color_banner || '#4c1d95';

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-40 sm:h-56 w-full flex items-center justify-center text-white px-6 text-center"
        style={{ background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}cc)` }}
      >
        {evento.logo_url ? (
          <img src={evento.logo_url} alt={evento.nombre} className="max-h-24 object-contain" />
        ) : (
          <h1 className="text-3xl sm:text-4xl font-display font-bold">{evento.nombre}</h1>
        )}
      </div>

      <div className="container max-w-xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-display font-semibold">¡Estás invitado!</h2>
            <p className="text-muted-foreground">{evento.nombre}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>{formatDate(evento.fecha_evento)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>{formatTime(evento.hora_inicio)}</span>
            </div>
            {evento.cupo_restante !== null && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span>{evento.cupo_restante} lugares disponibles</span>
              </div>
            )}
            {evento.mensaje && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap pt-3 border-t">
                {evento.mensaje}
              </p>
            )}
          </CardContent>
        </Card>

        {cerrado ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">
            La fecha límite de confirmación ya pasó.
          </CardContent></Card>
        ) : cupoAgotado ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">
            No hay más cupo disponible.
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader>
              <h3 className="font-display font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Confirmar asistencia
              </h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" required maxLength={100}
                    value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" maxLength={255}
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" maxLength={30}
                      value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                  </div>
                </div>
                {evento.acompanantes_max > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="acompanantes">Acompañantes (máx. {evento.acompanantes_max})</Label>
                    <Input id="acompanantes" type="number" min={0} max={evento.acompanantes_max}
                      value={form.acompanantes}
                      onChange={e => setForm({ ...form, acompanantes: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="restricciones">Restricciones alimentarias</Label>
                  <Input id="restricciones" maxLength={300}
                    placeholder="Vegetariano, sin TACC..."
                    value={form.restricciones}
                    onChange={e => setForm({ ...form, restricciones: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mensaje">Mensaje para el anfitrión</Label>
                  <Textarea id="mensaje" maxLength={500} rows={3}
                    value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} />
                </div>
                <Button type="submit" className="w-full btn-hero" disabled={isPending} size="lg">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirmar asistencia
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
