/**
 * PICKEVENT - Paso 2: Personalización
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Palette, ImageIcon, Wand2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { stepPersonalizationSchema, StepPersonalizationData } from '@/lib/validations/event';
import { IA_STYLES } from '@/lib/constants';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { formatPrice, cn } from '@/lib/utils';

interface StepPersonalizationProps {
  data: Partial<StepPersonalizationData>;
  onNext: (data: StepPersonalizationData) => void;
  onBack: () => void;
}

const defaultColors = [
  '#4c1d95', // Púrpura oscuro
  '#be185d', // Magenta
  '#dc2626', // Rojo
  '#ea580c', // Naranja
  '#ca8a04', // Amarillo
  '#16a34a', // Verde
  '#0891b2', // Cyan
  '#2563eb', // Azul
  '#7c3aed', // Violeta
  '#000000', // Negro
];

export function StepPersonalization({ data, onNext, onBack }: StepPersonalizationProps) {
  const { prices } = usePublicPrices();
  
  const form = useForm<StepPersonalizationData>({
    resolver: zodResolver(stepPersonalizationSchema),
    defaultValues: {
      es_premium: data.es_premium || false,
      tema_ia: data.tema_ia || '',
      estilo_ia: data.estilo_ia,
      logo_url: data.logo_url || '',
      color_banner: data.color_banner || '#4c1d95',
    },
  });

  const esPremium = form.watch('es_premium');
  const colorBanner = form.watch('color_banner');

  const onSubmit = (values: StepPersonalizationData) => {
    onNext(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Personalizá tu muro
          </h2>
          <p className="text-muted-foreground mt-2">
            Hacé único tu evento con colores y efectos especiales
          </p>
        </div>

        {/* Toggle Premium */}
        <div className={cn(
          'p-6 rounded-2xl border-2 transition-all duration-300',
          esPremium
            ? 'border-accent bg-gradient-to-br from-accent/10 to-primary/10 shadow-glow-accent'
            : 'border-border bg-card'
        )}>
          <FormField
            control={form.control}
            name="es_premium"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-xl',
                    esPremium ? 'bg-gradient-premium' : 'bg-muted'
                  )}>
                    <Wand2 className={cn(
                      'w-6 h-6',
                      esPremium ? 'text-foreground' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <FormLabel className="text-lg font-semibold cursor-pointer">
                      Modo Premium + IA
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Transformá las fotos con inteligencia artificial
                    </FormDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="badge-premium">+{formatPrice(prices.premium.precio - prices.basico.precio)}</span>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* Opciones de IA (solo si premium) */}
          {esPremium && (
            <div className="mt-6 pt-6 border-t border-border/50 space-y-6 animate-fade-in-up">
              {/* Tema IA */}
              <FormField
                control={form.control}
                name="tema_ia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Tema para la IA
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Fiesta en la playa, Superhéroes, Años 80..."
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      La IA usará este tema para transformar las fotos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estilo IA */}
              <FormField
                control={form.control}
                name="estilo_ia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo artístico</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {Object.entries(IA_STYLES).map(([key, { label, description, icon }]) => {
                        const isSelected = field.value === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => field.onChange(key)}
                            className={cn(
                              'flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200',
                              isSelected
                                ? 'border-accent bg-accent/10'
                                : 'border-border bg-card hover:border-accent/50'
                            )}
                          >
                            <span className="text-xl mb-1">{icon}</span>
                            <span className={cn(
                              'font-medium text-sm',
                              isSelected ? 'text-accent' : 'text-foreground'
                            )}>
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Color del banner */}
        <FormField
          control={form.control}
          name="color_banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4" />
                Color del banner
              </FormLabel>
              <div className="space-y-4">
                {/* Preview */}
                <div
                  className="h-16 rounded-xl transition-colors duration-300 flex items-center justify-center"
                  style={{ backgroundColor: colorBanner }}
                >
                  <span className="text-white font-semibold text-sm opacity-80">
                    Así se verá tu banner
                  </span>
                </div>
                
                {/* Paleta de colores */}
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={cn(
                        'w-10 h-10 rounded-full transition-all duration-200',
                        colorBanner === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <FormControl>
                    <input
                      type="color"
                      value={field.value || '#4c1d95'}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-10 h-10 rounded-full cursor-pointer border-0"
                      title="Color personalizado"
                    />
                  </FormControl>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logo URL (opcional) */}
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />
                Logo del evento (opcional)
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/mi-logo.png"
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Pegá la URL de una imagen para mostrar en el banner
              </FormDescription>
              <FormMessage />
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
