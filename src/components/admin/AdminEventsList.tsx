/**
 * PICKEVENT - Lista de Eventos del Super Admin
 * Muestra todos los eventos creados por el admin para su gestión
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarDays, 
  Eye, 
  Clock, 
  Search, 
  Plus,
  Sparkles,
  QrCode,
  ExternalLink,
  Filter
} from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminEvent {
  id: string;
  nombre: string;
  tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  estado: string;
  es_premium: boolean;
  precio_pagado: number;
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  qr_pantalla_token: string;
  qr_invitados_token: string;
  created_at: string;
  tenant_id: string | null;
}

const estadoColors: Record<string, string> = {
  programado: 'bg-info/20 text-info',
  activo: 'bg-success/20 text-success',
  pausado: 'bg-warning/20 text-warning',
  finalizado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/20 text-destructive',
};

export function AdminEventsList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-events', user?.id],
    queryFn: async (): Promise<AdminEvent[]> => {
      if (!user?.id) return [];

      // Super Admin puede ver todos los eventos creados por él/ella
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('cliente_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || event.estado === filterEstado;
    return matchesSearch && matchesEstado;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error al cargar eventos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Mis Eventos ({events?.length || 0})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Eventos creados por vos como Super Admin
            </p>
          </div>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/crear-evento">
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="programado">Programados</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="pausado">Pausados</SelectItem>
              <SelectItem value="finalizado">Finalizados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de eventos */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {events?.length === 0 ? 'No tenés eventos aún' : 'No hay eventos que coincidan'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {events?.length === 0 
                ? 'Creá tu primer evento con cortesía ilimitada'
                : 'Probá con otros términos de búsqueda'
              }
            </p>
            {events?.length === 0 && (
              <Button asChild>
                <Link to="/crear-evento">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear mi primer evento
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const eventType = EVENT_TYPES[event.tipo as keyof typeof EVENT_TYPES];
              
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{eventType?.icon || '🎉'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{event.nombre}</h4>
                          {event.es_premium && (
                            <Sparkles className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {eventType?.label || event.tipo}
                        </p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatDate(event.fecha_evento)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{event.hora_inicio}hs</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>📸 {event.total_fotos}</span>
                      <span>🎥 {event.total_videos}</span>
                      <span>💬 {event.total_mensajes}</span>
                    </div>

                    {/* Price */}
                    <div className="text-sm font-medium">
                      {event.precio_pagado === 0 ? (
                        <span className="text-accent">Cortesía</span>
                      ) : (
                        <span className="text-primary">{formatPrice(event.precio_pagado)}</span>
                      )}
                    </div>

                    {/* Status */}
                    <Badge className={estadoColors[event.estado] || 'bg-muted'}>
                      {event.estado}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/evento/${event.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Gestionar
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={`/muro/${event.qr_pantalla_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <QrCode className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
