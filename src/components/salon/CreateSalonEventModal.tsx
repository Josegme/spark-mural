/**
 * PICKEVENT - Modal para crear evento (Salón)
 * Wizard simplificado para crear eventos
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CalendarIcon,
  PartyPopper,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, generateQRToken } from '@/lib/utils';
import { EVENT_TYPES, IA_STYLES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SalonStats, SalonTenantInfo } from '@/hooks/useSalonData';
import type { Database } from '@/integrations/supabase/types';

type EventType = Database['public']['Enums']['event_type'];
type IAStyle = Database['public']['Enums']['ia_style'];

interface CreateSalonEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantInfo: SalonTenantInfo | null;
  stats: SalonStats;
  onSuccess: () => void;
}

interface FormData {
  nombre: string;
  tipo: EventType;
  fecha_evento: Date | undefined;
  hora_inicio: string;
  duracion_horas: number;
  es_premium: boolean;
  tema_ia: string;
  estilo_ia: IAStyle;
}

export function CreateSalonEventModal({ 
  open, 
  onOpenChange, 
  tenantInfo,
  stats,
  onSuccess 
}: CreateSalonEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: 'cumpleanos',
    fecha_evento: undefined,
    hora_inicio: '20:00',
    duracion_horas: 24,
    es_premium: false,
    tema_ia: '',
    estilo_ia: 'caricatura',
  });

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('Ingresá el nombre del evento');
      return;
    }
    if (!formData.fecha_evento) {
      toast.error('Seleccioná la fecha del evento');
      return;
    }
    if (!tenantInfo?.id) {
      toast.error('Error: No se encontró el salón');
      return;
    }

    // Verificar que puede crear
    if (!stats.puedeCrearEvento) {
      if (stats.alertaCritica) {
        toast.error('Tu suscripción está vencida. Renovála para crear eventos.');
      } else {
        toast.error('Alcanzaste el límite de eventos del mes.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Generar tokens QR únicos
      const qr_pantalla_token = generateQRToken();
      const qr_invitados_token = generateQRToken();
      const qr_descarga_token = generateQRToken();

      // Obtener el user actual (el salón es el cliente del evento)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Crear el evento
      const { error: eventoError } = await supabase
        .from('eventos')
        .insert([{
          cliente_user_id: user.id,
          nombre: formData.nombre,
          tipo: formData.tipo,
          fecha_evento: format(formData.fecha_evento, 'yyyy-MM-dd'),
          hora_inicio: formData.hora_inicio,
          duracion_horas: formData.duracion_horas,
          es_premium: formData.es_premium,
          tema_ia: formData.es_premium ? formData.tema_ia : null,
          estilo_ia: formData.es_premium ? formData.estilo_ia : null,
          estado: 'programado',
          qr_pantalla_token,
          qr_invitados_token,
          qr_descarga_token,
        }]);

      if (eventoError) throw eventoError;

      toast.success('¡Evento creado exitosamente!');
      
      // Reset form
      setFormData({
        nombre: '',
        tipo: 'cumpleanos',
        fecha_evento: undefined,
        hora_inicio: '20:00',
        duracion_horas: 24,
        es_premium: false,
        tema_ia: '',
        estilo_ia: 'caricatura',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventosRestantes = stats.limiteEventosMes - stats.eventosEsteMes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            Crear Nuevo Evento
          </DialogTitle>
          <DialogDescription>
            Eventos disponibles este mes: {eventosRestantes}/{stats.limiteEventosMes}
          </DialogDescription>
        </DialogHeader>

        {!stats.puedeCrearEvento && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {stats.alertaCritica 
                ? 'Tu suscripción está vencida. No podés crear eventos.'
                : 'Alcanzaste el límite de eventos del mes.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Nombre del evento */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Evento *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Cumple de María"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              disabled={!stats.puedeCrearEvento}
            />
          </div>

          {/* Tipo de evento */}
          <div className="space-y-2">
            <Label>Tipo de Evento *</Label>
            <Select 
              value={formData.tipo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as EventType }))}
              disabled={!stats.puedeCrearEvento}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.icon} {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha del Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_evento && "text-muted-foreground"
                    )}
                    disabled={!stats.puedeCrearEvento}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_evento 
                      ? format(formData.fecha_evento, "PPP", { locale: es })
                      : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_evento}
                    onSelect={(date) => setFormData(prev => ({ ...prev, fecha_evento: date }))}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora de Inicio *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                  className="pl-10"
                  disabled={!stats.puedeCrearEvento}
                />
              </div>
            </div>
          </div>

          {/* Duración */}
          <div className="space-y-2">
            <Label>Duración del Evento</Label>
            <Select 
              value={String(formData.duracion_horas)}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duracion_horas: Number(value) }))}
              disabled={!stats.puedeCrearEvento}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="12">12 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Premium con IA */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <div>
                <Label className="text-base font-semibold">Evento Premium con IA</Label>
                <p className="text-sm text-muted-foreground">
                  Transforma las fotos con inteligencia artificial
                </p>
              </div>
            </div>
            <Switch
              checked={formData.es_premium}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, es_premium: checked }))}
              disabled={!stats.puedeCrearEvento}
            />
          </div>

          {/* Opciones Premium */}
          {formData.es_premium && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Tema de IA</Label>
                <Input
                  placeholder="Ej: Superhéroes Marvel, Años 80, Piratas..."
                  value={formData.tema_ia}
                  onChange={(e) => setFormData(prev => ({ ...prev, tema_ia: e.target.value }))}
                  disabled={!stats.puedeCrearEvento}
                />
              </div>

              <div className="space-y-2">
                <Label>Estilo Visual</Label>
                <Select 
                  value={formData.estilo_ia}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, estilo_ia: value as IAStyle }))}
                  disabled={!stats.puedeCrearEvento}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IA_STYLES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.icon} {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !stats.puedeCrearEvento}
            className="btn-hero"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Evento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
