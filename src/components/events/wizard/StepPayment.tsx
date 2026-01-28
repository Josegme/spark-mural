/**
 * PICKEVENT - Paso 4: Pago y Confirmación
 * Muestra automáticamente Stripe o Mercado Pago según el país
 * Incluye: evento promocional (solo Super Admin) y copiar link de pago
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, CreditCard, Check, Calendar, Clock, Timer, Sparkles, QrCode, Copy, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { stepPaymentSchema, StepPaymentData } from '@/lib/validations/event';
import { WizardFormData, PaymentGateway } from '@/hooks/useCreateEvent';
import { EVENT_TYPES, EVENT_PRICES } from '@/lib/constants';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StepPaymentProps {
  formData: WizardFormData;
  onSubmit: () => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
  calculatePrice: () => number;
  activeGateway?: PaymentGateway;
  // New props for promotional events and copy link
  isSuperAdmin?: boolean;
  onCreatePromotional?: () => Promise<boolean>;
  onCopyPaymentLink?: () => Promise<boolean>;
  paymentLink?: string | null;
}

export function StepPayment({ 
  formData, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  calculatePrice, 
  activeGateway = 'mercadopago',
  isSuperAdmin = false,
  onCreatePromotional,
  onCopyPaymentLink,
  paymentLink,
}: StepPaymentProps) {
  const [isPromotionalMode, setIsPromotionalMode] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  const form = useForm<StepPaymentData>({
    resolver: zodResolver(stepPaymentSchema),
    defaultValues: {
      aceptaTerminos: false,
    },
  });

  const handleSubmit = async (values: StepPaymentData) => {
    if (!values.aceptaTerminos) return;
    
    if (isPromotionalMode && onCreatePromotional) {
      await onCreatePromotional();
    } else {
      await onSubmit();
    }
  };

  const handleCopyLink = async () => {
    if (!onCopyPaymentLink) return;
    
    setIsCopyingLink(true);
    try {
      await onCopyPaymentLink();
    } finally {
      setIsCopyingLink(false);
    }
  };

  const precio = calculatePrice();
  const eventType = EVENT_TYPES[formData.tipo as keyof typeof EVENT_TYPES];
  const planDetails = formData.es_premium ? EVENT_PRICES.premium : EVENT_PRICES.basico;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Confirmá tu evento
          </h2>
          <p className="text-muted-foreground mt-2">
            Revisá los detalles antes de confirmar
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

          {/* Premium badge */}
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

        {/* Super Admin: Promotional Event Option */}
        {isSuperAdmin && onCreatePromotional && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
            <div className="flex items-start gap-3">
              <Checkbox
                id="promotional"
                checked={isPromotionalMode}
                onCheckedChange={(checked) => setIsPromotionalMode(!!checked)}
              />
              <label htmlFor="promotional" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">
                    Crear como Evento Promocional
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  El evento se crea sin cobro (demo/promoción). Solo visible para Super Admin.
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Total */}
        <div className={cn(
          'p-6 rounded-2xl border-2',
          isPromotionalMode 
            ? 'border-accent bg-accent/5' 
            : formData.es_premium 
              ? 'border-accent bg-gradient-to-r from-accent/5 to-primary/5' 
              : 'border-primary bg-primary/5'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-muted-foreground text-sm">
                {isPromotionalMode ? 'Evento promocional' : 'Total a pagar'}
              </span>
              <div className="text-3xl font-bold text-foreground font-display">
                {isPromotionalMode ? '$0' : formatPrice(precio)}
              </div>
              {isPromotionalMode && (
                <span className="text-xs text-accent">Sin cargo - Promocional</span>
              )}
            </div>
            {!isPromotionalMode && (
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
            )}
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
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              className="gap-2"
              disabled={isSubmitting || isCopyingLink}
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </Button>
            
            <div className="flex gap-2">
              {/* Copy Payment Link Button - Only for non-promotional */}
              {!isPromotionalMode && onCopyPaymentLink && activeGateway === 'mercadopago' && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleCopyLink}
                  disabled={isSubmitting || isCopyingLink}
                  className="gap-2"
                >
                  {isCopyingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copiar Link
                </Button>
              )}

              <Button
                type="submit"
                size="lg"
                className={cn(
                  "min-w-[200px]",
                  isPromotionalMode 
                    ? "bg-accent hover:bg-accent/90" 
                    : "bg-gradient-primary hover:opacity-90"
                )}
                disabled={isSubmitting || isCopyingLink}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : isPromotionalMode ? (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Crear Evento Promocional
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmar y Pagar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
