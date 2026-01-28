/**
 * PICKEVENT - Widget de Pago de Suscripción para Salones
 * Botón prominente para renovar suscripción con Mercado Pago
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { SalonSubscription, SalonStats, SalonTenantInfo } from '@/hooks/useSalonData';

interface SubscriptionPaymentWidgetProps {
  suscripcion: SalonSubscription | null;
  stats: SalonStats;
  tenantInfo: SalonTenantInfo | null;
  isLoading: boolean;
}

const PLAN_PRICE = 150000; // $150,000 ARS
const PLAN_EVENTS_LIMIT = 10;

export function SubscriptionPaymentWidget({ 
  suscripcion, 
  stats, 
  tenantInfo,
  isLoading 
}: SubscriptionPaymentWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Siempre mostrar el widget de pago (el usuario pidió que esté siempre visible)
  if (isLoading) {
    return null;
  }

  const handlePaySubscription = async () => {
    if (!tenantInfo) {
      toast.error('Error: No se encontró información del salón');
      return;
    }

    setIsProcessing(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Construir URLs de retorno
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/salon?payment=success`;
      const failureUrl = `${baseUrl}/salon?payment=failure`;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-salon-subscription-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          salon_id: tenantInfo.id,
          salon_email: tenantInfo.email,
          salon_nombre: tenantInfo.nombre,
          success_url: successUrl,
          failure_url: failureUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.init_point) {
        // Redirigir al checkout de Mercado Pago
        toast.success('Redirigiendo a Mercado Pago...');
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Error al crear el pago');
      }
    } catch (error: unknown) {
      console.error('Error initiating subscription payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determinar estado visual
  const isUrgent = stats.alertaCritica || !stats.suscripcionActiva;
  const isWarning = stats.alertaVencimiento || stats.alertaLimite;

  return (
    <Card className={`border-2 ${isUrgent ? 'border-destructive bg-destructive/5' : isWarning ? 'border-warning bg-warning/5' : 'border-primary bg-gradient-to-br from-primary/10 to-primary/5'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            <CardTitle className="text-lg">
              {isUrgent ? '¡Renovar Suscripción!' : 'Tu Plan Mensual'}
            </CardTitle>
          </div>
          {stats.suscripcionActiva && !isUrgent && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Activo - {stats.diasHastaVencimiento} días
            </Badge>
          )}
          {isUrgent && (
            <Badge variant="destructive">Vencida</Badge>
          )}
          {isWarning && !isUrgent && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
              {stats.diasHastaVencimiento} días restantes
            </Badge>
          )}
        </div>
        <CardDescription>
          {isUrgent 
            ? 'Tu suscripción ha vencido. Renovála ahora para seguir creando eventos.'
            : `Usaste ${stats.eventosEsteMes} de ${stats.limiteEventosMes} eventos este mes.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Plan Mensual</p>
              <p className="text-sm text-muted-foreground">{PLAN_EVENTS_LIMIT} eventos incluidos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatPrice(PLAN_PRICE)}</p>
            <p className="text-xs text-muted-foreground">/mes</p>
          </div>
        </div>

        {/* Cuota de eventos */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Eventos usados este mes</span>
          </div>
          <div className={`text-lg font-bold ${stats.alertaLimite ? 'text-warning' : 'text-foreground'}`}>
            {stats.eventosEsteMes} / {stats.limiteEventosMes}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Acceso completo al muro interactivo</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>QR codes para cada evento</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Álbum descargable (30 días)</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
          size="lg"
          onClick={handlePaySubscription}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5 mr-2" />
              {isUrgent ? 'Renovar Ahora' : 'Pagar Suscripción'}
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Pago seguro con Mercado Pago. Tu plan se activa inmediatamente.
        </p>
      </CardContent>
    </Card>
  );
}
