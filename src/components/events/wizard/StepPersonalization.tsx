/**
 * PICKEVENT - Paso 2: Personalización
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Palette, ImageIcon, Wand2, ChevronLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { stepPersonalizationSchema, StepPersonalizationData } from '@/lib/validations/event';
import { IA_STYLES, FEATURE_FLAGS } from '@/lib/constants';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { formatPrice, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(data.logo_url || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
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

  // Manejar selección de archivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2MB');
      return;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se aceptan imágenes JPG, PNG o WEBP');
      return;
    }

    setLogoFile(file);
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Limpiar logo seleccionado
  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    form.setValue('logo_url', '');
  };

  const onSubmit = async (values: StepPersonalizationData) => {
    let finalLogoUrl = values.logo_url;

    // Si hay un archivo de logo nuevo, subirlo
    if (logoFile) {
      setIsUploadingLogo(true);
      try {
        const fileName = `logos/${Date.now()}_${logoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('contenido-eventos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('contenido-eventos')
          .getPublicUrl(fileName);

        finalLogoUrl = urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Error al subir el logo');
        setIsUploadingLogo(false);
        return;
      } finally {
        setIsUploadingLogo(false);
      }
    }

    onNext({ ...values, logo_url: finalLogoUrl });
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
          !FEATURE_FLAGS.IA_ENABLED
            ? 'border-border bg-card opacity-75'
            : esPremium
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
                    esPremium && FEATURE_FLAGS.IA_ENABLED ? 'bg-gradient-premium' : 'bg-muted'
                  )}>
                    <Wand2 className={cn(
                      'w-6 h-6',
                      esPremium && FEATURE_FLAGS.IA_ENABLED ? 'text-foreground' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <FormLabel className="text-lg font-semibold cursor-pointer">
                      Modo Premium + IA
                      {!FEATURE_FLAGS.IA_ENABLED && (
                        <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                          🚀 Próximamente
                        </span>
                      )}
                    </FormLabel>
                    <FormDescription className="text-sm">
                      {FEATURE_FLAGS.IA_ENABLED
                        ? 'Transformá las fotos con inteligencia artificial'
                        : 'Estamos preparando esta función. ¡Muy pronto podrás transformar fotos con IA!'}
                    </FormDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="badge-premium">+{formatPrice(prices.premium.precio - prices.basico.precio)}</span>
                  </div>
                  <FormControl>
                    <Switch
                      checked={FEATURE_FLAGS.IA_ENABLED ? field.value : false}
                      onCheckedChange={(checked) => {
                        if (!FEATURE_FLAGS.IA_ENABLED) {
                          toast.info('🚀 La función de IA estará disponible muy pronto. ¡Mantenete atento!');
                          return;
                        }
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* Opciones de IA (solo si premium Y feature habilitado) */}
          {esPremium && FEATURE_FLAGS.IA_ENABLED && (
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

        {/* Logo del evento (opcional) */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-base font-medium text-foreground">
            <ImageIcon className="w-4 h-4" />
            Logo del evento (opcional)
          </label>
          
          {/* Preview del logo */}
          {logoPreview && (
            <div className="relative group">
              <img
                src={logoPreview}
                alt="Preview del logo"
                className="w-full h-32 object-cover rounded-xl border-2 border-border"
              />
              <button
                type="button"
                onClick={handleClearLogo}
                disabled={isUploadingLogo}
                className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input de archivo */}
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className={cn(
                'flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                logoFile ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-accent/5',
                isUploadingLogo && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div className="text-sm">
                {isUploadingLogo ? (
                  <span className="text-muted-foreground">Subiendo...</span>
                ) : logoFile ? (
                  <>
                    <span className="font-medium text-foreground">{logoFile.name}</span>
                    <span className="text-xs text-muted-foreground"> • Haz clic para cambiar</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Clic para subir una imagen</span>
                    <span className="text-xs text-muted-foreground"> • JPG, PNG o WEBP (máx 2MB)</span>
                  </>
                )}
              </div>
            </label>
          </div>
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
            disabled={isUploadingLogo}
            className="min-w-[160px] bg-gradient-primary hover:opacity-90 disabled:opacity-50"
          >
            {isUploadingLogo ? 'Subiendo logo...' : 'Siguiente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
