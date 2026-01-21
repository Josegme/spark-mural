/**
 * PICKEVENT - Pantalla de éxito al crear evento
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, QrCode, Monitor, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMuroUrl, getUploadUrl, getDownloadUrl, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EventCreatedSuccessProps {
  event: {
    id: string;
    qr_pantalla_token: string;
    qr_invitados_token: string;
    qr_descarga_token: string;
  };
  eventName: string;
  onGoToDashboard: () => void;
  onViewMuro: () => void;
}

interface QRCardProps {
  title: string;
  description: string;
  token: string;
  icon: React.ReactNode;
  colorClass: string;
  getUrl: (token: string) => string;
}

function QRCard({ title, description, token, icon, colorClass, getUrl }: QRCardProps) {
  const url = getUrl(token);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiada al portapapeles');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg',
      colorClass
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <code className="text-xs bg-background/50 px-2 py-1 rounded truncate flex-1 block">
              .../{token}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={copyToClipboard}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventCreatedSuccess({ event, eventName, onGoToDashboard, onViewMuro }: EventCreatedSuccessProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center space-y-8">
      {/* Ícono de éxito */}
      <div className={cn(
        'mx-auto w-24 h-24 rounded-full bg-success/20 flex items-center justify-center transition-all duration-500',
        showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      )}>
        <CheckCircle className="w-14 h-14 text-success" />
      </div>

      {/* Título */}
      <div className={cn(
        'space-y-2 transition-all duration-500 delay-150',
        showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}>
        <h2 className="text-3xl font-display font-bold text-foreground">
          ¡Evento creado! 🎉
        </h2>
        <p className="text-lg text-muted-foreground">
          <span className="font-semibold text-primary">{eventName}</span> está listo
        </p>
      </div>

      {/* QR Codes */}
      <div className={cn(
        'space-y-4 transition-all duration-500 delay-300',
        showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}>
        <div className="flex items-center gap-2 justify-center text-muted-foreground">
          <QrCode className="w-5 h-5" />
          <span className="font-medium">Tus códigos QR</span>
        </div>

        <div className="grid gap-4 text-left">
          <QRCard
            title="QR Pantalla"
            description="Mostrá el muro en la pantalla del evento"
            token={event.qr_pantalla_token}
            icon={<Monitor className="w-5 h-5 text-primary" />}
            colorClass="border-primary/30 bg-primary/5"
            getUrl={getMuroUrl}
          />
          <QRCard
            title="QR Invitados"
            description="Los invitados escanean para subir fotos"
            token={event.qr_invitados_token}
            icon={<Users className="w-5 h-5 text-secondary" />}
            colorClass="border-secondary/30 bg-secondary/5"
            getUrl={getUploadUrl}
          />
          <QRCard
            title="QR Descarga"
            description="Acceso al álbum del evento (30 días)"
            token={event.qr_descarga_token}
            icon={<Download className="w-5 h-5 text-accent" />}
            colorClass="border-accent/30 bg-accent/5"
            getUrl={getDownloadUrl}
          />
        </div>
      </div>

      {/* Próximos pasos */}
      <div className={cn(
        'p-4 rounded-xl bg-muted/50 border text-left transition-all duration-500 delay-500',
        showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}>
        <h4 className="font-semibold text-sm text-foreground mb-2">📋 Próximos pasos:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Imprimí los QR codes o compartilos por WhatsApp</li>
          <li>El día del evento, abrí el QR Pantalla en una TV o proyector</li>
          <li>Los invitados escanean el QR Invitados para subir fotos</li>
          <li>¡Después descargá el álbum completo!</li>
        </ol>
      </div>

      {/* Botones */}
      <div className={cn(
        'flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 delay-700',
        showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}>
        <Button
          variant="outline"
          size="lg"
          onClick={onGoToDashboard}
          className="min-w-[160px]"
        >
          Ir al Dashboard
        </Button>
        <Button
          size="lg"
          onClick={onViewMuro}
          className="min-w-[160px] bg-gradient-primary hover:opacity-90"
        >
          Ver Muro en Vivo
        </Button>
      </div>
    </div>
  );
}
