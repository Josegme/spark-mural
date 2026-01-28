/**
 * PICKEVENT - Paso 4: Pago para Admin/Asistente
 * Opciones: Generar link de pago O crear evento promocional
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Check, Calendar, Clock, Timer, Sparkles, QrCode, Loader2, Mail, Copy, Gift, Link, CreditCard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WizardFormData, PaymentGateway } from '@/hooks/useCreateEvent';
import { EVENT_TYPES, EVENT_PRICES } from '@/lib/constants';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const adminPaymentSchema = z.object({
  clienteEmail: z.string().email('Email inválido').min(1, 'Ingresá el email del cliente'),
  paymentMode: z.enum(['link', 'promotional']),
  aceptaTerminos: z.boolean().refine(val => val === true, {
    message: 'Debés aceptar los términos y condiciones',
  }),
});

type AdminPaymentData = z.infer<typeof adminPaymentSchema>;

interface StepPaymentAdminProps {
  formData: WizardFormData;
  onGeneratePaymentLink: (clienteEmail: string) => Promise<string | null>;
  onCreatePromotional: (clienteEmail: string) => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
  calculatePrice: () => number;
  activeGateway?: PaymentGateway;
  paymentLink?: string | null;
  isAsistente?: boolean;
}

export function StepPaymentAdmin({ 
  formData, 
  onGeneratePaymentLink, 
  onCreatePromotional,
  onBack, 
  isSubmitting, 
  calculatePrice, 
  activeGateway = 'mercadopago',
  paymentLink,
  isAsistente = false,
}: StepPaymentAdminProps) {
  const [generatedLink, setGeneratedLink] = useState<string | null>(paymentLink || null);
  const [isCopying, setIsCopying] = useState(false);

  const form = useForm<AdminPaymentData>({
    resolver: zodResolver(adminPaymentSchema),
    defaultValues: {
      clienteEmail: '',
      paymentMode: 'link',
      aceptaTerminos: false,
    },
  });

  const paymentMode = form.watch('paymentMode');

  const handleSubmit = async (values: AdminPaymentData) => {
    if (!values.aceptaTerminos) return;
    
    if (values.paymentMode === 'promotional') {
      await onCreatePromotional(values.clienteEmail);
    } else {
      const link = await onGeneratePaymentLink(values.clienteEmail);
      if (link) {
        setGeneratedLink(link);
      }
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedLink);
    } finally {
      setIsCopying(false);
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
            {isAsistente ? 'Crear evento para cliente' : 'Gestionar evento'}
          </h2>
          <p className="text-muted-foreground mt-2">
            Ingresá los datos y elegí cómo procesar el pago
          </p>
        </div>

        {/* Email del cliente */}
        <FormField
          control={form.control}
          name="clienteEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email del Cliente *
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                El cliente recibirá los códigos QR en este email
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Modo de pago */}
        <FormField
          control={form.control}
          name="paymentMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cómo procesar este evento?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <label
                    htmlFor="mode-link"
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMode === 'link' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-muted-foreground/30'
                    )}
                  >
                    <RadioGroupItem value="link" id="mode-link" className="sr-only" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMode === 'link' ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <Link className={cn(
                          "w-5 h-5",
                          paymentMode === 'link' ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <span className="font-semibold text-foreground">Link de Pago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generá un link para que el cliente pague por {activeGateway === 'stripe' ? 'Stripe' : 'Mercado Pago'}
                    </p>
                    <div className="mt-2 text-lg font-bold text-primary">
                      {formatPrice(precio)}
                    </div>
                  </label>

                  <label
                    htmlFor="mode-promotional"
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMode === 'promotional' 
                        ? 'border-accent bg-accent/5' 
                        : 'border-muted hover:border-muted-foreground/30'
                    )}
                  >
                    <RadioGroupItem value="promotional" id="mode-promotional" className="sr-only" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMode === 'promotional' ? 'bg-accent/20' : 'bg-muted'
                      )}>
                        <Gift className={cn(
                          "w-5 h-5",
                          paymentMode === 'promotional' ? 'text-accent' : 'text-muted-foreground'
                        )} />
                      </div>
                      <span className="font-semibold text-foreground">Cortesía / Promocional</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Creá el evento sin cobro (demo, regalo, promoción)
                    </p>
                    <div className="mt-2 text-lg font-bold text-accent">
                      $0 - Gratis
                    </div>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Link generado */}
        {generatedLink && paymentMode === 'link' && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-2">
                  ¡Link de pago generado!
                </p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="text-xs font-mono bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={isCopying}
                  >
                    {isCopying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Compartí este link por WhatsApp o email. El evento se creará automáticamente cuando el cliente pague.
                </p>
              </div>
            </div>
          </div>
        )}

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
                El cliente recibirá 3 códigos QR únicos:
              </p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>• <strong>QR Pantalla:</strong> Para mostrar el muro en vivo</li>
                <li>• <strong>QR Invitados:</strong> Para que suban fotos y mensajes</li>
                <li>• <strong>QR Descarga:</strong> Para acceder al álbum (30 días)</li>
              </ul>
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
            className={cn(
              "min-w-[200px]",
              paymentMode === 'promotional' 
                ? "bg-accent hover:bg-accent/90" 
                : "bg-gradient-primary hover:opacity-90"
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : paymentMode === 'promotional' ? (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Crear Evento Promocional
              </>
            ) : generatedLink ? (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </>
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                Generar Link de Pago
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
