/**
 * Tarjeta de evento individual para el dashboard
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Camera, 
  MessageSquare, 
  QrCode, 
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatTime, getMuroUrl } from '@/lib/utils';
import type { UserEvent } from '@/hooks/useUserEvents';

interface EventCardProps {
  event: UserEvent;
  onViewQR?: (event: UserEvent) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  programado: { label: 'Programado', className: 'badge-info' },
  activo: { label: 'En vivo', className: 'badge-success' },
  pausado: { label: 'Pausado', className: 'badge-warning' },
  finalizado: { label: 'Finalizado', className: 'bg-muted text-muted-foreground' },
  cancelado: { label: 'Cancelado', className: 'badge-destructive' },
};

const eventTypeLabels: Record<string, string> = {
  cumpleanos: '🎂 Cumpleaños',
  casamiento: '💒 Casamiento',
  quince: '👑 15 Años',
  corporativo: '🏢 Corporativo',
  bautismo: '👶 Bautismo',
  comunion: '✝️ Comunión',
  otro: '🎉 Evento',
};

export function EventCard({ event, onViewQR }: EventCardProps) {
  const status = statusConfig[event.estado] || statusConfig.programado;
  const typeLabel = eventTypeLabels[event.tipo] || eventTypeLabels.otro;
  const muroUrl = getMuroUrl(event.qr_pantalla_token);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      <Link to={`/evento/${event.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-display line-clamp-1">
                  {event.nombre}
                </CardTitle>
                {event.es_premium && (
                  <Badge className="badge-premium text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{typeLabel}</span>
                <span className={status.className + ' text-xs'}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.fecha_evento)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTime(event.hora_inicio)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 border-t border-b">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-primary" />
              <span className="font-medium">{event.total_fotos}</span>
              <span className="text-xs text-muted-foreground">fotos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="font-medium">{event.total_mensajes}</span>
              <span className="text-xs text-muted-foreground">mensajes</span>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              onViewQR?.(event);
            }}
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Codes
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-primary hover:opacity-90"
            asChild
          >
            <a href={muroUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Muro
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
