/**
 * PICKEVENT - Paso 3: Configuración
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Upload, ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { stepConfigurationSchema, StepConfigurationData } from '@/lib/validations/event';
import { cn } from '@/lib/utils';

interface StepConfigurationProps {
  data: Partial<StepConfigurationData>;
  onNext: (data: StepConfigurationData) => void;
  onBack: () => void;
}

export function StepConfiguration({ data, onNext, onBack }: StepConfigurationProps) {
  const form = useForm<StepConfigurationData>({
    resolver: zodResolver(stepConfigurationSchema),
    defaultValues: {
      limite_subidas_por_invitado: data.limite_subidas_por_invitado,
      moderacion_activa: data.moderacion_activa || false,
    },
  });

  const moderacionActiva = form.watch('moderacion_activa');

  const onSubmit = (values: StepConfigurationData) => {
    onNext(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Configuración del evento
          </h2>
          <p className="text-muted-foreground mt-2">
            Ajustá las opciones de control y moderación
          </p>
        </div>

        {/* Límite de subidas por invitado */}
        <div className="p-6 rounded-2xl border bg-card">
          <FormField
            control={form.control}
            name="limite_subidas_por_invitado"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base">
                  <Upload className="w-5 h-5 text-primary" />
                  Límite de subidas por invitado
                </FormLabel>
                <div className="flex items-center gap-4 mt-2">
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="Sin límite"
                      className="h-12 w-32"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val ? parseInt(val) : undefined);
                      }}
                    />
                  </FormControl>
                  <span className="text-muted-foreground">
                    fotos/videos por persona
                  </span>
                </div>
                <FormDescription className="flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Dejá vacío para permitir subidas ilimitadas. Un límite evita que un mismo invitado sature el muro.
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Moderación */}
        <div className={cn(
          'p-6 rounded-2xl border-2 transition-all duration-300',
          moderacionActiva
            ? 'border-warning bg-warning/5'
            : 'border-border bg-card'
        )}>
          <FormField
            control={form.control}
            name="moderacion_activa"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-xl mt-0.5',
                    moderacionActiva ? 'bg-warning/20' : 'bg-muted'
                  )}>
                    <Shield className={cn(
                      'w-6 h-6',
                      moderacionActiva ? 'text-warning' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="space-y-2">
                    <FormLabel className="text-lg font-semibold cursor-pointer">
                      Moderación de contenido
                    </FormLabel>
                    <FormDescription>
                      Si está activa, todo el contenido debe ser aprobado antes de aparecer en el muro.
                      Ideal para eventos corporativos o donde se necesite control total.
                    </FormDescription>
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {moderacionActiva && (
            <div className="mt-4 pt-4 border-t border-warning/20 animate-fade-in-up">
              <div className="flex items-start gap-2 text-sm text-warning">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Importante:</strong> Con la moderación activa, vas a necesitar revisar y aprobar 
                  cada foto, video o mensaje antes de que aparezca en la pantalla. Tendrás acceso a un 
                  panel de moderación en tiempo real.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <h4 className="font-semibold text-sm text-foreground mb-2">💡 Tips para tu evento</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Eventos familiares: moderación desactivada funciona perfecto</li>
            <li>• Eventos corporativos: activá la moderación para control total</li>
            <li>• Fiestas grandes: poné un límite de 5-10 fotos por persona</li>
          </ul>
        </div>

        {/* Botones navegación */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </Button>
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
