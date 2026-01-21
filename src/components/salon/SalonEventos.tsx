/**
 * PICKEVENT - Lista de Eventos del Salón
 * Tabla con todos los eventos y acciones rápidas
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Plus,
  Search,
  MoreHorizontal,
  QrCode,
  Eye,
  Calendar,
  Sparkles,
  Image,
  Video,
  MessageSquare
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { EVENT_TYPES, EVENT_STATUS } from '@/lib/constants';
import type { SalonEvent } from '@/hooks/useSalonData';

interface SalonEventosProps {
  eventos: SalonEvent[];
  isLoading: boolean;
  puedeCrear: boolean;
  onCreateEvent: () => void;
}

export function SalonEventos({ eventos, isLoading, puedeCrear, onCreateEvent }: SalonEventosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(evento => {
    const matchSearch = evento.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'todos' || evento.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-500';
      case 'programado': return 'bg-blue-500';
      case 'finalizado': return 'bg-gray-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Mis Eventos ({eventos.length})
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            {/* Filtro de estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="h-10 px-3 rounded-md border bg-background text-sm"
            >
              <option value="todos">Todos</option>
              <option value="programado">Programados</option>
              <option value="activo">Activos</option>
              <option value="finalizado">Finalizados</option>
            </select>

            {/* Botón crear */}
            <Button 
              onClick={onCreateEvent}
              disabled={!puedeCrear}
              className="btn-hero"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {eventosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay eventos</p>
            <p className="text-sm">
              {searchTerm 
                ? 'No se encontraron eventos con ese nombre'
                : 'Creá tu primer evento para empezar'}
            </p>
            {!searchTerm && puedeCrear && (
              <Button 
                onClick={onCreateEvent}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Evento
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventosFiltrados.map((evento) => {
                  const tipoInfo = EVENT_TYPES[evento.tipo as keyof typeof EVENT_TYPES];
                  const estadoInfo = EVENT_STATUS[evento.estado as keyof typeof EVENT_STATUS];
                  
                  return (
                    <TableRow key={evento.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{evento.nombre}</span>
                              {evento.es_premium && (
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {tipoInfo?.icon} {tipoInfo?.label || evento.tipo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(evento.fecha_evento)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(evento.hora_inicio)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{evento.duracion_horas}hs</TableCell>
                      <TableCell>
                        <Badge className={`${getEstadoColor(evento.estado)} text-white`}>
                          {estadoInfo?.label || evento.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {evento.total_fotos}
                          </span>
                          <span className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            {evento.total_videos}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {evento.total_mensajes}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
