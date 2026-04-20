/**
 * Header del detalle del evento con info principal y acciones
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle,
  MoreVertical,
  ExternalLink,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { formatDate, formatTime, getMuroUrl } from '@/lib/utils';
import type { EventDetails } from '@/hooks/useEventDetails';

interface EventHeaderProps {
  event: EventDetails;
  onChangeStatus: (status: string) => void;
  onOpenQR: () => void;
  isUpdating?: boolean;
  pagoPendiente?: boolean;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  programado: { label: 'Programado', className: 'badge-info', icon: Calendar },
  activo: { label: 'En vivo', className: 'badge-success', icon: Play },
  pausado: { label: 'Pausado', className: 'badge-warning', icon: Pause },
  finalizado: { label: 'Finalizado', className: 'bg-muted text-muted-foreground', icon: CheckCircle },
  cancelado: { label: 'Cancelado', className: 'badge-destructive', icon: CheckCircle },
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

export function EventHeader({ event, onChangeStatus, onOpenQR, isUpdating, pagoPendiente }: EventHeaderProps) {
  const status = statusConfig[event.estado] || statusConfig.programado;
  const typeLabel = eventTypeLabels[event.tipo] || eventTypeLabels.otro;
  const StatusIcon = status.icon;

  const muroUrl = getMuroUrl(event.qr_pantalla_token);

  const canActivate = (event.estado === 'programado' || event.estado === 'pausado') && !pagoPendiente;
  const canPause = event.estado === 'activo';
  const canFinish = event.estado === 'activo' || event.estado === 'pausado';

  return (
    <div className="border-b pb-6 mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">{event.nombre}</span>
      </div>

      {pagoPendiente && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Pago pendiente — el muro se activará cuando el cliente confirme el pago
        </div>
      )}

      {/* Header principal */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-fluid-2xl font-display font-bold leading-tight break-words">
              {event.nombre}
            </h1>
            {event.es_premium && (
              <Badge className="badge-premium shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          {/* Mobile: grid 2x2; Desktop: flex wrap */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:flex md:flex-wrap md:items-center md:gap-4 text-xs sm:text-sm">
            <span className="text-muted-foreground truncate">{typeLabel}</span>
            <span className={`${status.className} flex items-center gap-1 justify-self-start md:order-last`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="truncate">{formatDate(event.fecha_evento)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">{formatTime(event.hora_inicio)}</span>
            </div>
          </div>
        </div>

        {/* Acciones — full width en mobile */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={onOpenQR} className="flex-1 md:flex-none touch-feedback">
            <QrCode className="w-4 h-4 mr-2" />
            <span className="sm:inline">QR</span>
            <span className="hidden sm:inline ml-1">Codes</span>
          </Button>

          <Button size="sm" asChild className="flex-1 md:flex-none touch-feedback">
            <a href={muroUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              <span>Ver Muro</span>
            </a>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isUpdating} className="shrink-0 touch-feedback">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canActivate && (
                <DropdownMenuItem onClick={() => onChangeStatus('activo')}>
                  <Play className="w-4 h-4 mr-2 text-success" />
                  Iniciar Evento
                </DropdownMenuItem>
              )}
              {canPause && (
                <DropdownMenuItem onClick={() => onChangeStatus('pausado')}>
                  <Pause className="w-4 h-4 mr-2 text-warning" />
                  Pausar Evento
                </DropdownMenuItem>
              )}
              {canFinish && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onChangeStatus('finalizado')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Evento
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
