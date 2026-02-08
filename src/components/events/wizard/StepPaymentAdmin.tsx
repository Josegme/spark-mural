/**
 * PICKEVENT - Paso 4: Pago para Admin/Asistente
 * Opciones: Generar link de pago O crear evento promocional
 * Con validación de cortesías: 2 cada 30 vendidos
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Calendar, Clock, Timer, Sparkles, QrCode, Loader2, Mail, Copy, Gift, Link, ExternalLink, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { WizardFormData, PaymentGateway } from '@/hooks/useCreateEvent';
import { EVENT_TYPES, EVENT_PRICES } from '@/lib/constants';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const adminPaymentSchema = z.object({
  clienteEmail: z.string().email('Email inválido').min(1, 'Ingresá el email del cliente'),
  paymentMode: z.enum(['link', 'promotional']),
  precioPersonalizado: z.number().min(0).optional(),
  aceptaTerminos: z.boolean().refine(val => val === true, {
    message: 'Debés aceptar los términos y condiciones',
  }),
});

type AdminPaymentData = z.infer<typeof adminPaymentSchema>;

interface StepPaymentAdminProps {
  formData: WizardFormData;
  onGeneratePaymentLink: (clienteEmail: string, precioOverride?: number) => Promise<string | null>;
  onCreatePromotional: (clienteEmail: string) => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
  calculatePrice: () => number;
  activeGateway?: PaymentGateway;
  paymentLink?: string | null;
  isAsistente?: boolean;
  // New props for courtesy validation
  eventosVendidosTotal?: number;
  eventosCortesiaDisponibles?: number;
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
  eventosVendidosTotal = 0,
  eventosCortesiaDisponibles = 2,
}: StepPaymentAdminProps) {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [generatedLink, setGeneratedLink] = useState<string | null>(paymentLink || null);
  const [isCopying, setIsCopying] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [usePrecioPersonalizado, setUsePrecioPersonalizado] = useState(false);
  const [precioPersonalizado, setPrecioPersonalizado] = useState<number>(calculatePrice());

  const form = useForm<AdminPaymentData>({
    resolver: zodResolver(adminPaymentSchema),
    defaultValues: {
      clienteEmail: '',
      paymentMode: 'link',
      aceptaTerminos: false,
    },
  });

  const paymentMode = form.watch('paymentMode');

  // Super Admin tiene cortesías ilimitadas, Asistentes usan el sistema de cuotas
  const esSuperAdmin = isSuperAdmin();
  const puedeUsarCortesia = esSuperAdmin || eventosCortesiaDisponibles > 0;
  const proximaCortesiaEn = 30 - (eventosVendidosTotal % 30);

  // Precio a usar: personalizado para Super Admin o el calculado para Asistentes
  const precioFinal = esSuperAdmin && usePrecioPersonalizado ? precioPersonalizado : calculatePrice();

  const handleSubmit = async (values: AdminPaymentData) => {
    if (!values.aceptaTerminos) return;
    
    if (values.paymentMode === 'promotional') {
      if (!puedeUsarCortesia) {
        toast.error(`No tenés cortesías disponibles. Vendé ${proximaCortesiaEn} eventos más para desbloquear 2.`);
        return;
      }
      await onCreatePromotional(values.clienteEmail);
    } else {
      // Pass custom price for Super Admin, otherwise use default
      const link = await onGeneratePaymentLink(values.clienteEmail, precioFinal);
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
      setLinkCopied(true);
      toast.success('¡Link copiado! Compartilo por WhatsApp o email');
    } catch (err) {
      toast.error('Error al copiar el link');
    } finally {
      setIsCopying(false);
    }
  };

  const handleGoToDashboard = () => {
    // Super Admin va a /admin, Asistente va a /asistente
    navigate(esSuperAdmin ? '/admin' : (isAsistente ? '/asistente' : '/dashboard'));
  };

  const precio = precioFinal; // Usar el precio final (personalizado o calculado)
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
                  disabled={!!generatedLink}
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
                  disabled={!!generatedLink}
                >
                  <label
                    htmlFor="mode-link"
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMode === 'link' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-muted-foreground/30',
                      generatedLink && 'opacity-60 cursor-not-allowed'
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
                      "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all relative",
                      paymentMode === 'promotional' 
                        ? 'border-accent bg-accent/5' 
                        : 'border-muted hover:border-muted-foreground/30',
                      !puedeUsarCortesia && 'opacity-60',
                      generatedLink && 'opacity-60 cursor-not-allowed'
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
                    {/* Courtesy counter badge */}
                    <div className={cn(
                      "absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full",
                      puedeUsarCortesia 
                        ? "bg-accent/20 text-accent" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {esSuperAdmin ? '∞ ilimitadas' : `${eventosCortesiaDisponibles} disponibles`}
                    </div>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Precio personalizado para Super Admin */}
        {esSuperAdmin && paymentMode === 'link' && (
          <div className="p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                id="usePrecioPersonalizado"
                checked={usePrecioPersonalizado}
                onCheckedChange={(checked) => setUsePrecioPersonalizado(checked === true)}
                disabled={!!generatedLink}
              />
              <Label htmlFor="usePrecioPersonalizado" className="font-medium cursor-pointer">
                Usar precio personalizado
              </Label>
            </div>
            {usePrecioPersonalizado && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={precioPersonalizado}
                  onChange={(e) => setPrecioPersonalizado(Number(e.target.value))}
                  className="w-40"
                  disabled={!!generatedLink}
                />
                <span className="text-sm text-muted-foreground">
                  (Precio sugerido: {formatPrice(calculatePrice())})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Warning for no courtesy available - Solo para Asistentes */}
        {paymentMode === 'promotional' && !puedeUsarCortesia && !esSuperAdmin && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  No tenés cortesías disponibles
                </p>
                <p className="text-muted-foreground mt-1">
                  Vendé {proximaCortesiaEn} evento{proximaCortesiaEn !== 1 ? 's' : ''} más para desbloquear 2 nuevas cortesías.
                  <br />
                  <span className="text-xs">Eventos vendidos: {eventosVendidosTotal} | Cada 30 ventas = 2 cortesías</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Link generado - Estado completado */}
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

        {/* Post-link completion message */}
        {linkCopied && (
          <div className="p-4 rounded-xl bg-info/10 border border-info/20">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-info mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  ¡Listo! Ya podés salir de esta pantalla
                </p>
                <p className="text-muted-foreground mt-1">
                  El evento se creará automáticamente cuando el cliente complete el pago. 
                  Recibirás una notificación y el cliente recibirá sus códigos QR por email.
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
                  disabled={!!generatedLink}
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
            onClick={linkCopied ? handleGoToDashboard : onBack}
            className="gap-2"
            disabled={isSubmitting}
          >
            {linkCopied ? (
              <>
                <Home className="w-4 h-4" />
                Volver al Dashboard
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </>
            )}
          </Button>
          
          {/* Main action button - changes based on state */}
          {linkCopied ? (
            <Button
              type="button"
              size="lg"
              className="min-w-[200px] bg-gradient-primary hover:opacity-90"
              onClick={handleGoToDashboard}
            >
              <Home className="w-4 h-4 mr-2" />
              Listo, volver al Dashboard
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className={cn(
                "min-w-[200px]",
                paymentMode === 'promotional' 
                  ? "bg-accent hover:bg-accent/90" 
                  : "bg-gradient-primary hover:opacity-90"
              )}
              disabled={isSubmitting || (paymentMode === 'promotional' && !puedeUsarCortesia)}
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
          )}
        </div>
      </form>
    </Form>
  );
}
