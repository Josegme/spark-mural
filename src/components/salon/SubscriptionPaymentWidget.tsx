/**
 * PICKEVENT - Widget de Pago de Suscripción para Salones
 * Muestra los 3 planes con precios dinámicos desde configuración global
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
  CheckCircle2,
  Building2,
  Crown
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useSubscriptionPrices } from '@/hooks/useSubscriptionPrices';
import type { SalonSubscription, SalonStats, SalonTenantInfo } from '@/hooks/useSalonData';

interface SubscriptionPaymentWidgetProps {
  suscripcion: SalonSubscription | null;
  stats: SalonStats;
  tenantInfo: SalonTenantInfo | null;
  isLoading: boolean;
}

const PLAN_ICONS = {
  starter: Building2,
  profesional: Sparkles,
  ilimitado: Crown,
};

export function SubscriptionPaymentWidget({ 
  suscripcion, 
  stats, 
  tenantInfo,
  isLoading 
}: SubscriptionPaymentWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { plans, isLoading: isPricesLoading } = useSubscriptionPrices();

  if (isLoading || isPricesLoading) {
    return null;
  }

  // IMPORTANTE: El frontend solo envía plan_id
  // El backend calcula el precio desde configuracion_global
  // Esto garantiza una única fuente de verdad para precios
  const handlePaySubscription = async (planId: string) => {
    if (!tenantInfo) {
      toast.error('Error: No se encontró información del salón');
      return;
    }

    setSelectedPlanId(planId);
    setIsProcessing(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Construir URLs de retorno
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/salon?payment=success`;
      const failureUrl = `${baseUrl}/salon?payment=failure`;

      // Solo enviamos plan_id - el backend resuelve el precio vigente
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
          plan_id: planId,
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
      setSelectedPlanId(null);
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
              {isUrgent ? '¡Renovar Suscripción!' : 'Tu Plan Trimestral'}
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

        {/* Planes disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const PlanIcon = PLAN_ICONS[plan.id as keyof typeof PLAN_ICONS] || CreditCard;
            const isSelected = selectedPlanId === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  plan.popular 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Badge Popular */}
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center space-y-3 pt-2">
                  {/* Icon */}
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <PlanIcon className="w-5 h-5" />
                  </div>

                  {/* Name & Events */}
                  <div>
                    <h4 className="font-semibold">{plan.nombre}</h4>
                    <p className="text-xs text-muted-foreground">
                      {plan.limite_eventos === -1 ? '∞' : plan.limite_eventos} eventos / 3 meses
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(plan.precio)}
                    </span>
                    <span className="text-xs text-muted-foreground">/3 meses</span>
                  </div>

                  {/* Button */}
                  <Button 
                    size="sm"
                    className={`w-full ${plan.popular ? '' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isProcessing}
                    onClick={() => handlePaySubscription(plan.id)}
                  >
                    {isProcessing && isSelected ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Elegir
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Todos los planes incluyen:</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span>Muro interactivo</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span>QR codes por evento</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span>Álbum descargable</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span>Soporte técnico</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Pago seguro con Mercado Pago. Tu plan se activa inmediatamente.
        </p>
      </CardContent>
    </Card>
  );
}
