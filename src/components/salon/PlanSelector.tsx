/**
 * PICKEVENT - Selector de Planes de Suscripción para Salones
 * Muestra los 3 planes: 10, 20, ilimitados eventos/mes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Sparkles,
  Building2,
  Crown,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  limite_eventos: number;
  descripcion: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const PLANES: Plan[] = [
  {
    id: 'starter',
    nombre: 'Starter',
    precio: 20000,
    limite_eventos: 10,
    descripcion: 'Ideal para salones pequeños',
    icon: <Building2 className="w-6 h-6" />,
    features: [
      '10 eventos por mes',
      'Muro interactivo en tiempo real',
      '3 QR codes por evento',
      'Álbum descargable (30 días)',
      'Soporte por email',
    ],
  },
  {
    id: 'profesional',
    nombre: 'Profesional',
    precio: 40000,
    limite_eventos: 20,
    descripcion: 'Para salones con demanda media',
    icon: <Sparkles className="w-6 h-6" />,
    popular: true,
    features: [
      '20 eventos por mes',
      'Todo lo del plan Starter',
      'Eventos Premium con IA',
      'Personalización avanzada',
      'Soporte prioritario',
      'Reportes detallados',
    ],
  },
  {
    id: 'ilimitado',
    nombre: 'Ilimitado',
    precio: 80000,
    limite_eventos: -1,
    descripcion: 'Sin límites para grandes empresas',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Eventos ilimitados',
      'Todo lo del plan Profesional',
      'API acceso (próximamente)',
      'White-label opcional',
      'Soporte dedicado 24/7',
      'Capacitación incluida',
    ],
  },
];

interface PlanSelectorProps {
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  showUpgradeOnly?: boolean;
}

export function PlanSelector({ currentPlanId, onSelectPlan, showUpgradeOnly = false }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === currentPlanId) {
      toast.info('Ya tenés este plan activo');
      return;
    }

    setSelectedPlan(plan.id);
    setIsProcessing(true);

    try {
      // Por ahora mostrar mensaje - la integración con MP se hace en el futuro
      toast.success(`Plan ${plan.nombre} seleccionado. Un asesor te contactará para completar la suscripción.`);
      
      if (onSelectPlan) {
        onSelectPlan(plan.id);
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPlanes = showUpgradeOnly && currentPlanId
    ? PLANES.filter(p => {
        const currentIndex = PLANES.findIndex(plan => plan.id === currentPlanId);
        const planIndex = PLANES.findIndex(plan => plan.id === p.id);
        return planIndex > currentIndex;
      })
    : PLANES;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold mb-2">
          {showUpgradeOnly ? 'Mejorá tu Plan' : 'Elegí tu Plan'}
        </h2>
        <p className="text-muted-foreground">
          Planes diseñados para cada tipo de salón
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPlanes.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isSelected = selectedPlan === plan.id;

          return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-200 ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : isCurrentPlan 
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'hover:border-primary/50'
              }`}
            >
              {/* Badge Popular */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Más Popular
                  </Badge>
                </div>
              )}

              {/* Badge Plan Actual */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-success text-success-foreground">
                    Tu Plan Actual
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                <CardDescription>{plan.descripcion}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Precio */}
                <div className="text-center">
                  <span className="text-4xl font-display font-bold">
                    {formatPrice(plan.precio)}
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </div>

                {/* Límite de eventos */}
                <div className="text-center p-3 bg-muted rounded-lg">
                  <span className="text-2xl font-bold text-primary">
                    {plan.limite_eventos === -1 ? '∞' : plan.limite_eventos}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    eventos/mes
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Botón */}
                <Button 
                  className={`w-full ${plan.popular ? 'btn-hero' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={isCurrentPlan || isProcessing}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isProcessing && isSelected ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : isCurrentPlan ? (
                    'Plan Actual'
                  ) : (
                    'Seleccionar Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Todos los planes incluyen soporte técnico y actualizaciones.
        Los precios están en pesos argentinos (ARS).
      </p>
    </div>
  );
}
