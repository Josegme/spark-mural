/**
 * PICKEVENT - Paso 1: Información Básica
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Timer, PartyPopper, Heart, GraduationCap, Building2, Sparkles, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stepBasicInfoSchema, StepBasicInfoData } from '@/lib/validations/event';
import { EVENT_TYPES, APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

const eventTypeIcons = {
  cumpleanos: PartyPopper,
  casamiento: Heart,
  graduacion: GraduationCap,
  corporativo: Building2,
  fiesta_tematica: Sparkles,
  otro: Star,
};

interface StepBasicInfoProps {
  data: Partial<StepBasicInfoData>;
  onNext: (data: StepBasicInfoData) => void;
}

export function StepBasicInfo({ data, onNext }: StepBasicInfoProps) {
  const form = useForm<StepBasicInfoData>({
    resolver: zodResolver(stepBasicInfoSchema),
    defaultValues: {
      nombre: data.nombre || '',
      tipo: data.tipo || 'cumpleanos',
      fecha_evento: data.fecha_evento || '',
      hora_inicio: data.hora_inicio || '20:00',
      duracion_horas: data.duracion_horas || 6,
    },
  });

  const onSubmit = (values: StepBasicInfoData) => {
    onNext(values);
  };

  // Obtener fecha mínima (hoy — el cliente puede activar el muro cuando quiera)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Aviso informativo cuando el evento es hoy y la hora es próxima
  const watchedFecha = form.watch('fecha_evento');
  const watchedHora = form.watch('hora_inicio');
  const showTimeWarning = (() => {
    if (!watchedFecha || !watchedHora) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (watchedFecha !== todayStr) return false;
    const now = new Date();
    const [h, m] = watchedHora.split(':').map(Number);
    const eventTime = new Date();
    eventTime.setHours(h, m, 0, 0);
    const diffMs = eventTime.getTime() - now.getTime();
    return diffMs < 60 * 60 * 1000; // menos de 1 hora
  })();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            ¿Qué evento vas a celebrar?
          </h2>
          <p className="text-muted-foreground mt-2">
            Contanos los detalles básicos de tu evento
          </p>
        </div>

        {/* Nombre del evento */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Nombre del evento</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cumpleaños de María, Boda Juan y Ana..."
                  className="h-12 text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de evento - Cards seleccionables */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Tipo de evento</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {Object.entries(EVENT_TYPES).map(([key, { label, icon }]) => {
                  const Icon = eventTypeIcons[key as keyof typeof eventTypeIcons];
                  const isSelected = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      )}
                    >
                      <span className="text-2xl mb-1">{icon}</span>
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha y hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fecha_evento"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha del evento
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={minDate}
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hora_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hora de inicio
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Aviso informativo (no bloqueante) */}
        {showTimeWarning && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
              Recordá que el pago puede tardar unos minutos en confirmarse.
            </AlertDescription>
          </Alert>
        )}

        {/* Duración */}
        <FormField
          control={form.control}
          name="duracion_horas"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Duración del evento
              </FormLabel>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {APP_CONFIG.EVENT_DURATIONS.map((hours) => {
                  const isSelected = field.value === hours;
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => field.onChange(hours)}
                      className={cn(
                        'flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      )}
                    >
                      <span className={cn(
                        'text-2xl font-bold',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {hours}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        horas
                      </span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botón siguiente */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            className="min-w-[160px] bg-gradient-primary hover:opacity-90"
          >
            Siguiente
          </Button>
        </div>
      </form>
    </Form>
  );
}
