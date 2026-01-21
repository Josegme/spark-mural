/**
 * PICKEVENT - Tabla de Clientes del Asistente
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Users,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import type { AsistenteCliente } from '@/hooks/useAsistenteData';

interface AsistenteClientesProps {
  clientes: AsistenteCliente[];
  isLoading: boolean;
}

export function AsistenteClientes({ clientes, isLoading }: AsistenteClientesProps) {
  const [search, setSearch] = useState('');

  const filteredClientes = clientes.filter((cliente) => {
    return (
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente.email.toLowerCase().includes(search.toLowerCase()) ||
      cliente.telefono?.toLowerCase().includes(search.toLowerCase())
    );
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

  if (clientes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin clientes todavía</h3>
          <p className="text-muted-foreground text-center">
            Los clientes aparecerán acá cuando crees eventos para ellos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Mis Clientes ({clientes.length})</CardTitle>
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Facturado</TableHead>
              <TableHead>Cliente desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{cliente.nombre}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{cliente.email}</span>
                    </div>
                    {cliente.telefono && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {cliente.pais ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{cliente.pais}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {cliente.total_eventos} evento{cliente.total_eventos !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-green-600">
                    {formatPrice(cliente.total_facturado)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {formatDate(cliente.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredClientes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron clientes con ese criterio
          </div>
        )}
      </CardContent>
    </Card>
  );
}
