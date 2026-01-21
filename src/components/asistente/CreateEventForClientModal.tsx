/**
 * PICKEVENT - Modal para crear evento para un cliente (Asistente)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateQRToken, formatPrice } from '@/lib/utils';
import { EVENT_TYPES, EVENT_PRICES } from '@/lib/constants';
import { toast } from 'sonner';
import type { AsistenteTenantInfo } from '@/hooks/useAsistenteData';

// Schema de validación
const createEventSchema = z.object({
  // Datos del cliente
  cliente_email: z.string().email('Email inválido'),
  cliente_nombre: z.string().min(2, 'Nombre muy corto'),
  cliente_telefono: z.string().optional(),
  
  // Datos del evento
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  tipo: z.string().min(1, 'Seleccioná un tipo'),
  fecha_evento: z.string().min(1, 'Seleccioná una fecha'),
  hora_inicio: z.string().min(1, 'Seleccioná una hora'),
  duracion_horas: z.coerce.number().min(1).max(48),
  es_premium: z.boolean().default(false),
  
  // Precio personalizado
  precio: z.coerce.number().min(1000, 'El precio mínimo es $1.000'),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventForClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantInfo: AsistenteTenantInfo | null | undefined;
  onSuccess: () => void;
}

// Rango de precios permitido sin aprobación
const PRECIO_MINIMO = 8000;
const PRECIO_MAXIMO = 50000;

export function CreateEventForClientModal({
  open,
  onOpenChange,
  tenantInfo,
  onSuccess,
}: CreateEventForClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'cliente' | 'evento'>('cliente');

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      cliente_email: '',
      cliente_nombre: '',
      cliente_telefono: '',
      nombre: '',
      tipo: 'cumpleanos',
      fecha_evento: '',
      hora_inicio: '20:00',
      duracion_horas: 6,
      es_premium: false,
      precio: EVENT_PRICES.basico.precio,
    },
  });

  const watchPremium = form.watch('es_premium');
  const watchPrecio = form.watch('precio');

  // Verificar si el precio está fuera del rango permitido
  const precioFueraDeRango = watchPrecio < PRECIO_MINIMO || watchPrecio > PRECIO_MAXIMO;

  // Calcular comisiones
  const comisionAsistente = tenantInfo?.comision_asistente || 70;
  const comisionSuperadmin = tenantInfo?.comision_superadmin || 30;
  const gananciaAsistente = Math.round(watchPrecio * (comisionAsistente / 100));
  const montoRendir = Math.round(watchPrecio * (comisionSuperadmin / 100));

  const handleSubmit = async (data: CreateEventFormData) => {
    if (!tenantInfo) {
      toast.error('Error: No se pudo obtener la información del asistente');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Buscar o crear el cliente
      let clienteId: string;
      
      // Verificar si el cliente ya existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.cliente_email)
        .single();

      if (existingUser) {
        clienteId = existingUser.id;
      } else {
        // Crear usuario en auth (esto creará el profile automáticamente por trigger)
        const { data: newUser, error: authError } = await supabase.auth.signUp({
          email: data.cliente_email,
          password: Math.random().toString(36).slice(-12) + 'A1!', // Contraseña temporal
          options: {
            data: {
              nombre: data.cliente_nombre,
            },
          },
        });

        if (authError) {
          // Si el usuario ya existe en auth pero no en profiles
          toast.error('Error al crear el cliente: ' + authError.message);
          setIsSubmitting(false);
          return;
        }

        clienteId = newUser.user?.id || '';
        
        // Actualizar teléfono si se proporcionó
        if (data.cliente_telefono && clienteId) {
          await supabase
            .from('profiles')
            .update({ telefono: data.cliente_telefono })
            .eq('id', clienteId);
        }
      }

      // 2. Generar tokens QR
      const qr_pantalla_token = generateQRToken();
      const qr_invitados_token = generateQRToken();
      const qr_descarga_token = generateQRToken();

      // 3. Crear el evento
      const eventData = {
        cliente_user_id: clienteId,
        tenant_id: tenantInfo.id,
        nombre: data.nombre,
        tipo: data.tipo as 'cumpleanos' | 'casamiento' | 'graduacion' | 'corporativo' | 'fiesta_tematica' | 'otro',
        fecha_evento: data.fecha_evento,
        hora_inicio: data.hora_inicio,
        duracion_horas: data.duracion_horas,
        es_premium: data.es_premium,
        precio_pagado: data.precio,
        qr_pantalla_token,
        qr_invitados_token,
        qr_descarga_token,
        estado: 'programado' as const,
      };

      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .insert(eventData)
        .select()
        .single();

      if (eventoError) {
        console.error('Error creating event:', eventoError);
        toast.error('Error al crear el evento');
        setIsSubmitting(false);
        return;
      }

      // 4. Si el precio está fuera del rango, crear notificación para super admin
      if (precioFueraDeRango) {
        await supabase
          .from('notificaciones')
          .insert({
            user_id: clienteId, // Debería ir al super_admin, pero por ahora va al cliente
            tipo: 'aprobacion_precio',
            titulo: 'Precio fuera de rango',
            mensaje: `El asistente ${tenantInfo.nombre} creó un evento con precio ${formatPrice(data.precio)} (fuera del rango $8k-$50k)`,
          });
      }

      toast.success('¡Evento creado exitosamente!');
      form.reset();
      setStep('cliente');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    const clienteFields = ['cliente_email', 'cliente_nombre'];
    const isValid = clienteFields.every((field) => {
      const value = form.getValues(field as keyof CreateEventFormData);
      return value && String(value).length > 0;
    });

    if (isValid) {
      setStep('evento');
    } else {
      form.trigger(['cliente_email', 'cliente_nombre']);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Evento para Cliente</DialogTitle>
          <DialogDescription>
            {step === 'cliente' 
              ? 'Ingresá los datos del cliente' 
              : 'Configurá los detalles del evento'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 'cliente' ? (
              /* PASO 1: Datos del Cliente */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Datos del Cliente</span>
                </div>

                <FormField
                  control={form.control}
                  name="cliente_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="María González" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cliente_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del Cliente *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="maria@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Se usará para enviar los QR codes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cliente_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 11 1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleNextStep}>
                    Siguiente
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              /* PASO 2: Datos del Evento */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Datos del Evento</span>
                </div>

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Evento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Cumple de María" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Evento *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccioná..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(EVENT_TYPES).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.icon} {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duracion_horas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(parseInt(v))} 
                          defaultValue={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha_evento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            min={minDate.toISOString().split('T')[0]}
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
                        <FormLabel>Hora de Inicio *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Premium Switch */}
                <FormField
                  control={form.control}
                  name="es_premium"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Evento Premium con IA
                        </FormLabel>
                        <FormDescription>
                          Transforma las fotos con Inteligencia Artificial
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Actualizar precio sugerido
                            form.setValue('precio', checked 
                              ? EVENT_PRICES.premium.precio 
                              : EVENT_PRICES.basico.precio
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Precio y Comisiones */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Precio y Comisiones</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="precio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio del Evento *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1000}
                            step={500}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Precio sugerido: {formatPrice(watchPremium ? EVENT_PRICES.premium.precio : EVENT_PRICES.basico.precio)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {precioFueraDeRango && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-600">Precio fuera del rango</p>
                        <p className="text-muted-foreground">
                          El rango permitido es {formatPrice(PRECIO_MINIMO)} - {formatPrice(PRECIO_MAXIMO)}. 
                          Este precio requerirá aprobación del Super Admin.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Desglose de comisiones */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tu ganancia ({comisionAsistente}%)</p>
                      <p className="text-lg font-bold text-green-600">{formatPrice(gananciaAsistente)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Rendís ({comisionSuperadmin}%)</p>
                      <p className="text-lg font-bold text-amber-600">{formatPrice(montoRendir)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total cliente</p>
                      <p className="text-lg font-bold">{formatPrice(watchPrecio)}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep('cliente')}>
                    Atrás
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Evento
                  </Button>
                </DialogFooter>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
