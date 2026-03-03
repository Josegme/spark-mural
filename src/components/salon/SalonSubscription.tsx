/**
 * PICKEVENT - Widget de Suscripción del Salón
 * Muestra estado del plan, próximo pago y alertas
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { SalonSubscription as SalonSubscriptionType, SalonStats } from '@/hooks/useSalonData';

interface SalonSubscriptionProps {
  suscripcion: SalonSubscriptionType | null;
  stats: SalonStats;
  isLoading: boolean;
}

export function SalonSubscription({ suscripcion, stats, isLoading }: SalonSubscriptionProps) {
  const [isPayingSubscription, setIsPayingSubscription] = useState(false);

  const handlePaySubscription = async () => {
    if (!suscripcion) return;
    
    setIsPayingSubscription(true);
    
    try {
      toast.info(
        'Para renovar tu suscripción, contactá a tu ejecutivo de cuenta o escribinos a soporte@pickevent.com',
        { duration: 6000 }
      );
    } catch (error) {
      console.error('Error initiating subscription payment:', error);
      toast.error('Error al iniciar el pago');
    } finally {
      setIsPayingSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-36" />
        </CardContent>
      </Card>
    );
  }

  if (!suscripcion) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Sin Suscripción Activa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No tenés una suscripción activa. Contactá con soporte para activar tu plan.
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:soporte@pickevent.com">
              Contactar Soporte
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getEstadoBadge = () => {
    if (stats.alertaCritica) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    if (stats.alertaVencimiento) {
      return <Badge className="bg-warning text-warning-foreground">Por Vencer</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Activa</Badge>;
  };

  const getEstadoIcon = () => {
    if (stats.alertaCritica) {
      return <AlertCircle className="w-8 h-8 text-destructive" />;
    }
    if (stats.alertaVencimiento) {
      return <Clock className="w-8 h-8 text-warning" />;
    }
    return <CheckCircle2 className="w-8 h-8 text-green-500" />;
  };

  // Formatear fecha de timestamp ISO de forma segura
  const formatSafeDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Calcular período de validez
  const getPeriodoValidez = () => {
    try {
      const inicio = new Date(suscripcion.fecha_inicio);
      const fin = new Date(suscripcion.fecha_vencimiento);
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return null;
      const diffMs = fin.getTime() - inicio.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const meses = Math.round(diffDays / 30);
      return meses > 1 ? `${meses} meses` : '1 mes';
    } catch {
      return null;
    }
  };

  // Precio a mostrar: precio real del plan (no el histórico de suscripciones)
  const precioMostrar = suscripcion.precio_plan_actual || suscripcion.precio_mensual;
  const periodoValidez = getPeriodoValidez();
  const DURACION_SUSCRIPCION = 3; // trimestral

  return (
    <Card className={`${stats.alertaCritica ? 'border-destructive/50' : stats.alertaVencimiento ? 'border-warning/50' : 'border-green-500/30'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Tu Suscripción
          </CardTitle>
          {getEstadoBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-center gap-4">
          {getEstadoIcon()}
          <div>
            <h3 className="text-2xl font-bold">Plan {suscripcion.plan_nombre || 'Premium'}</h3>
            <p className="text-muted-foreground">
              {formatPrice(precioMostrar)} / {DURACION_SUSCRIPCION} meses
            </p>
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Próximo Pago</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {formatSafeDate(suscripcion.fecha_proximo_pago)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Vencimiento</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {formatSafeDate(suscripcion.fecha_vencimiento)}
              </span>
            </div>
          </div>
        </div>

        {/* Contador de días */}
        {stats.diasHastaVencimiento > 0 && (
          <div className={`text-center p-3 rounded-lg ${
            stats.alertaVencimiento 
              ? 'bg-warning/10 text-warning' 
              : 'bg-muted'
          }`}>
            <span className="text-2xl font-bold">{stats.diasHastaVencimiento}</span>
            <span className="text-sm ml-2">días restantes</span>
          </div>
        )}

        {/* Límite de eventos + Validez */}
        <div className="space-y-2">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Eventos incluidos</span>
              <span className="font-bold">
                {suscripcion.limite_eventos_mes === -1 ? '∞' : suscripcion.limite_eventos_mes} / {DURACION_SUSCRIPCION} meses
              </span>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Validez del plan</span>
              <span className="font-bold">{periodoValidez || `${DURACION_SUSCRIPCION} meses`}</span>
            </div>
          </div>
        </div>

        {/* Botón de Pago */}
        {(stats.alertaCritica || stats.alertaVencimiento) && (
          <Button 
            className="w-full" 
            onClick={handlePaySubscription}
            disabled={isPayingSubscription}
          >
            {isPayingSubscription ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                {stats.alertaCritica ? 'Renovar Suscripción' : 'Pagar Ahora'}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
