/**
 * PICKEVENT - Calendario de Eventos del Salón
 * Vista de próximos eventos con calendario
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { EVENT_TYPES, EVENT_STATUS } from '@/lib/constants';
import type { SalonEvent } from '@/hooks/useSalonData';

interface SalonCalendarProps {
  eventos: SalonEvent[];
  isLoading: boolean;
}

export function SalonCalendar({ eventos, isLoading }: SalonCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Convertir fechas de eventos para marcar en el calendario
  const eventDates = eventos.map(e => new Date(e.fecha_evento));
  
  // Filtrar eventos del día seleccionado
  const eventosDelDia = selectedDate 
    ? eventos.filter(e => {
        const fechaEvento = new Date(e.fecha_evento);
        return fechaEvento.toDateString() === selectedDate.toDateString();
      })
    : [];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-500';
      case 'programado': return 'bg-blue-500';
      case 'finalizado': return 'bg-gray-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Calendario de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasEvent: eventDates,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
              },
            }}
          />
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/20" />
              <span>Con evento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos del día seleccionado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate 
              ? `Eventos del ${formatDate(selectedDate)}`
              : 'Seleccioná una fecha'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosDelDia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay eventos para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventosDelDia.map((evento) => {
                const tipoInfo = EVENT_TYPES[evento.tipo as keyof typeof EVENT_TYPES];
                const estadoInfo = EVENT_STATUS[evento.estado as keyof typeof EVENT_STATUS];
                
                return (
                  <div 
                    key={evento.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{evento.nombre}</h4>
                          {evento.es_premium && (
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{tipoInfo?.icon} {tipoInfo?.label || evento.tipo}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatTime(evento.hora_inicio)}</span>
                          <span className="text-muted-foreground">
                            ({evento.duracion_horas}hs)
                          </span>
                        </div>
                      </div>
                      
                      <Badge className={`${getEstadoColor(evento.estado)} text-white`}>
                        {estadoInfo?.label || evento.estado}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
