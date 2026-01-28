/**
 * PICKEVENT - Tarjetas de eventos del Salón (estilo dashboard)
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Image, 
  MessageSquare, 
  Plus,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { EVENT_STATUS } from '@/lib/constants';
import type { SalonEvent } from '@/hooks/useSalonData';

interface SalonEventCardsProps {
  eventos: SalonEvent[];
  isLoading: boolean;
  puedeCrear: boolean;
  onCreateEvent: () => void;
}

export function SalonEventCards({ eventos, isLoading, puedeCrear, onCreateEvent }: SalonEventCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <div className="h-9 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case 'activo': return 'default';
      case 'programado': return 'secondary';
      case 'finalizado': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold">Mis Eventos</h2>
        {eventos.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateEvent}
            disabled={!puedeCrear}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        )}
      </div>

      {eventos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PartyPopper className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No tenés eventos creados todavía
            </p>
            {puedeCrear && (
              <Button onClick={onCreateEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Evento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.map((evento) => {
            const estadoInfo = EVENT_STATUS[evento.estado as keyof typeof EVENT_STATUS];
            
            return (
              <Card 
                key={evento.id} 
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">
                        {evento.nombre}
                      </CardTitle>
                      {evento.es_premium && (
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PartyPopper className="w-4 h-4" />
                    <span>Evento</span>
                    <Badge variant={getEstadoVariant(evento.estado)}>
                      {estadoInfo?.label || evento.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(evento.fecha_evento)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(evento.hora_inicio)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Image className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">{evento.total_fotos}</span>
                      <span className="text-muted-foreground">fotos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">{evento.total_mensajes}</span>
                      <span className="text-muted-foreground">mensajes</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/evento/${evento.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
