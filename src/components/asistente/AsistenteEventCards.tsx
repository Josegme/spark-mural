/**
 * PICKEVENT - Tarjetas de eventos del Asistente (estilo dashboard)
 * Con soporte para eventos pendientes de pago (bloqueados)
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
  PartyPopper,
  User,
  Lock,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatTime, formatPrice } from '@/lib/utils';
import { EVENT_STATUS } from '@/lib/constants';
import { toast } from 'sonner';
import type { AsistenteEvent } from '@/hooks/useAsistenteData';

interface AsistenteEventCardsProps {
  eventos: AsistenteEvent[];
  isLoading: boolean;
  puedeCrear: boolean;
  onCreateEvent: () => void;
}

export function AsistenteEventCards({ eventos, isLoading, puedeCrear, onCreateEvent }: AsistenteEventCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          <div className="h-9 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getEstadoVariant = (estado: string, pagoPendiente: boolean) => {
    if (pagoPendiente) return 'destructive';
    switch (estado) {
      case 'activo': return 'default';
      case 'programado': return 'secondary';
      case 'finalizado': return 'outline';
      default: return 'outline';
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('¡Link copiado! Compartilo con el cliente');
    } catch {
      toast.error('Error al copiar el link');
    }
  };

  // Mostrar últimos 6 eventos
  const eventosRecientes = eventos.slice(0, 6);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventosRecientes.map((evento) => {
            const estadoInfo = EVENT_STATUS[evento.estado as keyof typeof EVENT_STATUS];
            const isPagoPendiente = evento.pago_estado === 'pendiente';
            const isBlocked = isPagoPendiente;
            
            return (
              <Card 
                key={evento.id} 
                className={`transition-colors ${isBlocked ? 'border-destructive/50 bg-destructive/5' : 'hover:border-primary/50'}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isBlocked && <Lock className="w-4 h-4 text-destructive flex-shrink-0" />}
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {evento.nombre}
                      </CardTitle>
                      {evento.es_premium && (
                        <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={getEstadoVariant(evento.estado, isPagoPendiente)}>
                      {isPagoPendiente ? '⏳ Pago Pendiente' : (estadoInfo?.label || evento.estado)}
                    </Badge>
                    <span className="text-primary font-medium">
                      {formatPrice(evento.precio_pagado)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cliente */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="truncate">{evento.cliente_nombre || 'Cliente'}</span>
                  </div>

                  {/* Fecha y hora */}
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
                  
                  {/* Contenido - solo si no está bloqueado */}
                  {!isBlocked && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">{evento.total_fotos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">{evento.total_mensajes}</span>
                      </div>
                    </div>
                  )}

                  {/* Mensaje de bloqueo */}
                  {isBlocked && (
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        <span>Acceso bloqueado hasta confirmar pago</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    {/* Si está bloqueado, mostrar acciones de link */}
                    {isBlocked && evento.payment_link ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="default"
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCopyLink(evento.payment_link!)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={evento.payment_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ) : isBlocked ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Esperando pago
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/evento/${evento.id}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                    )}
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
