/**
 * PICKEVENT - Paso 4: Pago para Salón
 * Usa cuota mensual del salón, ingresa email del cliente
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Check, Calendar, Clock, Timer, Sparkles, QrCode, Loader2, Mail, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardFormData } from '@/hooks/useCreateEvent';
import { EVENT_TYPES } from '@/lib/constants';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { formatDate } from '@/lib/utils';

const salonPaymentSchema = z.object({
  clienteEmail: z.string().email('Email inválido').min(1, 'Ingresá el email del cliente'),
  aceptaTerminos: z.boolean().refine(val => val === true, {
    message: 'Debés aceptar los términos y condiciones',
  }),
});

type SalonPaymentData = z.infer<typeof salonPaymentSchema>;

interface StepPaymentSalonProps {
  formData: WizardFormData;
  onSubmit: (clienteEmail: string) => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
  eventosDisponibles: number;
  limiteEventosMes: number;
  puedeCrearEvento: boolean;
  suscripcionVencida?: boolean;
}

export function StepPaymentSalon({ 
  formData, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  eventosDisponibles,
  limiteEventosMes,
  puedeCrearEvento,
  suscripcionVencida = false,
}: StepPaymentSalonProps) {
  const { prices } = usePublicPrices();
  const form = useForm<SalonPaymentData>({
    resolver: zodResolver(salonPaymentSchema),
    defaultValues: {
      clienteEmail: '',
      aceptaTerminos: false,
    },
  });

  const handleSubmit = async (values: SalonPaymentData) => {
    if (!values.aceptaTerminos) return;
    await onSubmit(values.clienteEmail);
  };

  const eventType = EVENT_TYPES[formData.tipo as keyof typeof EVENT_TYPES];
  const planDetails = formData.es_premium ? prices.premium : prices.basico;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Crear evento para cliente
          </h2>
          <p className="text-muted-foreground mt-2">
            Ingresá los datos del cliente para crear el evento
          </p>
        </div>

        {/* Alerta de cuota */}
        {!puedeCrearEvento && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {suscripcionVencida 
                ? 'Tu suscripción está vencida. Renovála para crear eventos.'
                : `Alcanzaste el límite de ${limiteEventosMes} eventos del mes.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Cuota disponible */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <span className="font-medium text-foreground">Eventos disponibles este mes</span>
              <div className="text-2xl font-bold text-primary">
                {eventosDisponibles} / {limiteEventosMes}
              </div>
            </div>
          </div>
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
                  disabled={!puedeCrearEvento}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                El cliente recibirá los códigos QR en este email
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Indicador de cuota */}
        <div className="p-6 rounded-2xl border-2 border-success bg-success/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-muted-foreground text-sm">Incluido en tu suscripción</span>
              <div className="text-2xl font-bold text-success font-display">
                Sin costo adicional
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-6 h-6 text-success" />
              <span className="text-sm text-muted-foreground">
                Usa 1 de tus {limiteEventosMes} eventos
              </span>
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
                  disabled={!puedeCrearEvento}
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
            className="min-w-[200px] bg-success hover:bg-success/90"
            disabled={isSubmitting || !puedeCrearEvento}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Crear Evento
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
