/**
 * PICKEVENT - Payment Success Page
 * Página que se muestra cuando el usuario vuelve de Mercado Pago con pago aprobado
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, ExternalLink, QrCode, Monitor, Users, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMuroUrl, getUploadUrl, getDownloadUrl, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout';

interface EventData {
  id: string;
  nombre: string;
  qr_pantalla_token: string;
  qr_invitados_token: string;
  qr_descarga_token: string;
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

  const generateQRImageUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

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
      <div className="flex flex-col items-center gap-4">
        {/* QR Code Image */}
        <div className="p-3 bg-white rounded-xl shadow-inner">
          <img
            src={generateQRImageUrl(url)}
            alt={`QR Code ${title}`}
            className="w-32 h-32"
          />
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {icon}
            <h4 className="font-semibold text-foreground">{title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const paymentRef = searchParams.get('ref');
  const paymentStatus = searchParams.get('payment');

  const isPending = paymentStatus === 'pending';

  useEffect(() => {
    if ((paymentStatus !== 'success' && paymentStatus !== 'pending') || !paymentRef) {
      navigate('/dashboard');
      return;
    }

    const fetchEventByPaymentRef = async () => {
      try {
        // El webhook puede tardar unos segundos en procesar el pago
        // Intentamos buscar el evento por payment_id o por external_reference
        const { data: pago, error: pagoError } = await supabase
          .from('pagos')
          .select('evento_id, estado')
          .or(`payment_id_externo.eq.${paymentRef},metadata->>external_reference.eq.${paymentRef}`)
          .single();

        if (pagoError || !pago) {
          // Si no encontramos el pago, puede que el webhook aún no haya procesado
          if (retryCount < 10) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
            return;
          }
          setError('No se encontró información del pago. Por favor, revisá tu email o contactanos.');
          setIsLoading(false);
          return;
        }

        if (!pago.evento_id) {
          // El evento aún no fue creado por el webhook
          if (retryCount < 10) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
            return;
          }
          setError('El evento está siendo procesado. Por favor, esperá unos segundos o revisá el dashboard.');
          setIsLoading(false);
          return;
        }

        // Buscar el evento
        const { data: evento, error: eventoError } = await supabase
          .from('eventos')
          .select('id, nombre, qr_pantalla_token, qr_invitados_token, qr_descarga_token')
          .eq('id', pago.evento_id)
          .single();

        if (eventoError || !evento) {
          setError('No se pudo cargar la información del evento.');
          setIsLoading(false);
          return;
        }

        setEvent(evento);
        setIsLoading(false);
        
        // Animación de entrada
        setTimeout(() => setShowContent(true), 300);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Ocurrió un error inesperado.');
        setIsLoading(false);
      }
    };

    fetchEventByPaymentRef();
  }, [paymentRef, paymentStatus, navigate, retryCount]);

  if (isLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <h2 className="text-2xl font-display font-bold">Procesando tu pago...</h2>
              <p className="text-muted-foreground mt-2">
                Estamos confirmando tu pago con Mercado Pago
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Verificando... ({retryCount}/10)
                </p>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <div>
              <h2 className="text-2xl font-display font-bold">Hubo un problema</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) return null;

  return (
    <MainLayout showFooter={false}>
      <div className="container py-8 md:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
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
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              ¡Pago confirmado! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Tu evento <span className="font-semibold text-primary">{event.nombre}</span> fue creado exitosamente
            </p>
          </div>

          {/* QR Codes */}
          <div className={cn(
            'space-y-6 transition-all duration-500 delay-300',
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}>
            <div className="flex items-center gap-2 justify-center text-muted-foreground">
              <QrCode className="w-5 h-5" />
              <span className="font-medium">Tus códigos QR</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <QRCard
                title="Pantalla"
                description="Mostrá el muro en la pantalla del evento"
                token={event.qr_pantalla_token}
                icon={<Monitor className="w-5 h-5 text-primary" />}
                colorClass="border-primary/30 bg-primary/5"
                getUrl={getMuroUrl}
              />
              <QRCard
                title="Invitados"
                description="Para que suban fotos y mensajes"
                token={event.qr_invitados_token}
                icon={<Users className="w-5 h-5 text-secondary" />}
                colorClass="border-secondary/30 bg-secondary/5"
                getUrl={getUploadUrl}
              />
              <QRCard
                title="Descarga"
                description="Acceso al álbum (30 días)"
                token={event.qr_descarga_token}
                icon={<Download className="w-5 h-5 text-accent" />}
                colorClass="border-accent/30 bg-accent/5"
                getUrl={getDownloadUrl}
              />
            </div>
          </div>

          {/* Próximos pasos */}
          <div className={cn(
            'p-6 rounded-xl bg-muted/50 border text-left max-w-xl mx-auto transition-all duration-500 delay-500',
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}>
            <h4 className="font-semibold text-foreground mb-3">📋 Próximos pasos:</h4>
            <ol className="text-muted-foreground space-y-2 list-decimal list-inside">
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
              onClick={() => navigate('/dashboard')}
              className="min-w-[160px]"
            >
              Ir al Dashboard
            </Button>
            <Button
              size="lg"
              onClick={() => window.open(getMuroUrl(event.qr_pantalla_token), '_blank')}
              className="min-w-[160px] bg-gradient-primary hover:opacity-90"
            >
              Ver Muro en Vivo
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
