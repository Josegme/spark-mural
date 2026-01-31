/**
 * PICKEVENT - Paso 4: Pago para Cliente
 * Flujo directo de pago (Mercado Pago / Stripe)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, CreditCard, Check, Calendar, Clock, Timer, Sparkles, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { stepPaymentSchema, StepPaymentData } from '@/lib/validations/event';
import { WizardFormData, PaymentGateway } from '@/hooks/useCreateEvent';
import { EVENT_TYPES } from '@/lib/constants';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { formatPrice, formatDate, cn } from '@/lib/utils';

interface StepPaymentClientProps {
  formData: WizardFormData;
  onSubmit: () => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
  calculatePrice: () => number;
  activeGateway?: PaymentGateway;
}

export function StepPaymentClient({ 
  formData, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  calculatePrice, 
  activeGateway = 'mercadopago',
}: StepPaymentClientProps) {
  const { prices } = usePublicPrices();
  
  const form = useForm<StepPaymentData>({
    resolver: zodResolver(stepPaymentSchema),
    defaultValues: {
      aceptaTerminos: false,
    },
  });

  const handleSubmit = async (values: StepPaymentData) => {
    if (!values.aceptaTerminos) return;
    await onSubmit();
  };

  const precio = calculatePrice();
  const eventType = EVENT_TYPES[formData.tipo as keyof typeof EVENT_TYPES];
  const planDetails = formData.es_premium ? prices.premium : prices.basico;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Confirmá tu evento
          </h2>
          <p className="text-muted-foreground mt-2">
            Revisá los detalles antes de pagar
          </p>
        </div>

        {/* Resumen del evento */}
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <span className="text-3xl">{eventType?.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-foreground">{formData.nombre}</h3>
              <span className="text-muted-foreground">{eventType?.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground block">Fecha</span>
                <span className="font-medium">
                  {formData.fecha_evento ? formatDate(formData.fecha_evento) : '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground block">Hora</span>
                <span className="font-medium">{formData.hora_inicio}hs</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Timer className="w-5 h-5 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground block">Duración</span>
                <span className="font-medium">{formData.duracion_horas} horas</span>
              </div>
            </div>
          </div>

          {formData.es_premium && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
              <Sparkles className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <span className="font-medium text-foreground">Modo Premium + IA</span>
                {formData.tema_ia && (
                  <span className="text-sm text-muted-foreground block">
                    Tema: {formData.tema_ia}
                  </span>
                )}
              </div>
              <span className="badge-premium">Incluido</span>
            </div>
          )}
        </div>

        {/* Lo que incluye */}
        <div className="p-6 rounded-2xl border bg-muted/30">
          <h4 className="font-semibold text-foreground mb-4">
            {planDetails.nombre} incluye:
          </h4>
          <ul className="space-y-2">
            {planDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* QR codes info */}
        <div className="p-4 rounded-xl bg-info/10 border border-info/20">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-info mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Al confirmar, recibirás 3 códigos QR únicos:
              </p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>• <strong>QR Pantalla:</strong> Para mostrar el muro en vivo</li>
                <li>• <strong>QR Invitados:</strong> Para que suban fotos y mensajes</li>
                <li>• <strong>QR Descarga:</strong> Para acceder al álbum (30 días)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className={cn(
          'p-6 rounded-2xl border-2',
          formData.es_premium 
            ? 'border-accent bg-gradient-to-r from-accent/5 to-primary/5' 
            : 'border-primary bg-primary/5'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-muted-foreground text-sm">Total a pagar</span>
              <div className="text-3xl font-bold text-foreground font-display">
                {formatPrice(precio)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
              <div className="text-right">
                <span className="text-sm text-muted-foreground block">
                  {activeGateway === 'stripe' ? 'Stripe' : 'Mercado Pago'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeGateway === 'stripe' ? 'Tarjeta de crédito/débito' : 'Tarjeta / Transferencia'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Términos y condiciones */}
        <FormField
          control={form.control}
          name="aceptaTerminos"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Acepto los{' '}
                  <a href="/terminos" className="text-primary underline hover:no-underline">
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/privacidad" className="text-primary underline hover:no-underline">
                    política de privacidad
                  </a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Botones navegación */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="gap-2"
            disabled={isSubmitting}
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </Button>
          
          <Button
            type="submit"
            size="lg"
            className="min-w-[200px] bg-gradient-primary hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmar y Pagar
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
