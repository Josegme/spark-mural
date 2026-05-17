/**
 * Modo Check-in para el organizador — scanner de QR con cámara
 */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, Users, RefreshCw } from 'lucide-react';
import { useCheckin, type CheckinResult } from '@/hooks/useCheckin';
import { cn } from '@/lib/utils';

type Feedback = { result: CheckinResult; key: number } | null;

export default function CheckinPage() {
  const { checkin_token } = useParams<{ checkin_token: string }>();
  const { mutateAsync: validar, isPending } = useCheckin(checkin_token);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>('');
  const cooldownRef = useRef<number>(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = 'qr-scanner-region';
    containerRef.current.id = id;
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decoded) => {
          const now = Date.now();
          if (decoded === lastScanRef.current && now - cooldownRef.current < 2500) return;
          lastScanRef.current = decoded;
          cooldownRef.current = now;
          try {
            // El QR contiene directamente el qr_token de la invitación
            const result = await validar(decoded.trim());
            setFeedback({ result, key: now });
          } catch (e) {
            setFeedback({
              result: { estado: 'invalido', nombre: null, acompanantes: null },
              key: now,
            });
          }
        },
        () => { /* ignore scan errors */ },
      )
      .then(() => setScanning(true))
      .catch((e) => setError(e?.message || 'No se pudo iniciar la cámara'));

    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, [validar]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Control de ingreso
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Apuntá la cámara al QR del invitado
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden bg-black aspect-square w-full">
              <div ref={containerRef} className="w-full h-full" />
            </div>
            {error && (
              <p className="text-sm text-destructive mt-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </p>
            )}
            {!scanning && !error && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Iniciando cámara...
              </p>
            )}
          </CardContent>
        </Card>

        {feedback && <FeedbackCard key={feedback.key} result={feedback.result} />}
        {isPending && (
          <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Validando...
          </p>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ result }: { result: CheckinResult }) {
  const config = {
    ok: { icon: CheckCircle2, title: '¡Ingreso confirmado!', cls: 'border-success bg-success/10 text-success' },
    ya_ingreso: { icon: AlertTriangle, title: 'Ya había ingresado', cls: 'border-warning bg-warning/10 text-warning' },
    no_confirmado: { icon: AlertTriangle, title: 'Sin confirmación', cls: 'border-warning bg-warning/10 text-warning' },
    invalido: { icon: XCircle, title: 'QR no válido', cls: 'border-destructive bg-destructive/10 text-destructive' },
    token_invalido: { icon: XCircle, title: 'Sesión de check-in inválida', cls: 'border-destructive bg-destructive/10 text-destructive' },
  }[result.estado];
  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.cls)}>
      <CardContent className="py-4 flex items-center gap-3">
        <Icon className="w-8 h-8 shrink-0" />
        <div>
          <p className="font-display font-semibold">{config.title}</p>
          {result.nombre && (
            <p className="text-sm">
              {result.nombre}{result.acompanantes ? ` + ${result.acompanantes} acomp.` : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
