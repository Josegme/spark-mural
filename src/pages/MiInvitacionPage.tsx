/**
 * Vista del invitado tras confirmar — muestra su QR personal
 */
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Calendar, Clock, CheckCircle2, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvitacionPersonal } from '@/hooks/useInvitaciones';
import { formatDate, formatTime } from '@/lib/utils';

export default function MiInvitacionPage() {
  const { qr_token } = useParams<{ qr_token: string }>();
  const { data: inv, isLoading, error } = useInvitacionPersonal(qr_token);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-display font-semibold">Invitación no encontrada</h1>
            <Button asChild variant="outline"><Link to="/">Ir al inicio</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(qr_token!)}`;
  const bannerColor = inv.color_banner || '#4c1d95';

  const downloadQR = async () => {
    const r = await fetch(qrImg);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitacion-${inv.evento_nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-32 w-full flex items-center justify-center text-white px-6"
        style={{ background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}cc)` }}>
        <h1 className="text-2xl font-display font-bold text-center">{inv.evento_nombre}</h1>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="py-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/15 text-success text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Confirmado
            </div>
            <h2 className="text-xl font-display font-semibold">Hola, {inv.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              Mostrá este código QR en el ingreso del evento
            </p>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl shadow-md ring-1 ring-border">
                <img src={qrImg} alt="QR de invitación"
                  className="w-[240px] h-[240px] block" loading="lazy" />
              </div>
            </div>

            {inv.ya_ingreso && (
              <div className="text-sm font-medium text-warning">
                Este QR ya fue utilizado para ingresar
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm pt-2">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatDate(inv.fecha_evento)}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{formatTime(inv.hora_inicio)}</span>
              </div>
            </div>

            {inv.acompanantes > 0 && (
              <p className="text-sm text-muted-foreground">
                Acompañantes: {inv.acompanantes}
              </p>
            )}

            <Button onClick={downloadQR} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" /> Descargar QR
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Guardá esta página o descargá el QR. Lo vas a necesitar el día del evento.
        </p>
      </div>
    </div>
  );
}
