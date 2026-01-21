/**
 * PICKEVENT - Tabla de Eventos del Asistente
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Eye,
  QrCode,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { EVENT_TYPES, EVENT_STATUS } from '@/lib/constants';
import type { AsistenteEvent } from '@/hooks/useAsistenteData';

interface AsistenteEventosProps {
  eventos: AsistenteEvent[];
  isLoading: boolean;
  onCreateEvent: () => void;
}

export function AsistenteEventos({ eventos, isLoading, onCreateEvent }: AsistenteEventosProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredEventos = eventos.filter((evento) => {
    const matchesSearch = 
      evento.nombre.toLowerCase().includes(search.toLowerCase()) ||
      evento.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      evento.cliente_email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || evento.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin eventos todavía</h3>
          <p className="text-muted-foreground text-center mb-4">
            Creá tu primer evento para un cliente
          </p>
          <Button onClick={onCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Evento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Mis Eventos ({eventos.length})</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar evento o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={onCreateEvent} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button
            variant={statusFilter === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('todos')}
          >
            Todos
          </Button>
          {Object.entries(EVENT_STATUS).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(key)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Contenido</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEventos.map((evento) => {
              const tipoConfig = EVENT_TYPES[evento.tipo as keyof typeof EVENT_TYPES];
              const estadoConfig = EVENT_STATUS[evento.estado as keyof typeof EVENT_STATUS];

              return (
                <TableRow key={evento.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${tipoConfig?.color || '#6b7280'}20` }}
                      >
                        {tipoConfig?.icon || '🎉'}
                      </div>
                      <div>
                        <p className="font-medium">{evento.nombre}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{tipoConfig?.label || evento.tipo}</span>
                          {evento.es_premium && (
                            <Badge variant="secondary" className="text-xs px-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{evento.cliente_nombre}</p>
                      <p className="text-xs text-muted-foreground">{evento.cliente_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatDate(evento.fecha_evento)}</p>
                      <p className="text-xs text-muted-foreground">{evento.hora_inicio}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: estadoConfig?.color,
                        color: estadoConfig?.color
                      }}
                    >
                      {estadoConfig?.icon} {estadoConfig?.label || evento.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatPrice(evento.precio_pagado)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span>📷 {evento.total_fotos}</span>
                      <span className="mx-1">•</span>
                      <span>🎥 {evento.total_videos}</span>
                      <span className="mx-1">•</span>
                      <span>💬 {evento.total_mensajes}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/evento/${evento.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <QrCode className="w-4 h-4 mr-2" />
                          Ver QR Codes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredEventos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron eventos con los filtros aplicados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
