/**
 * Tabla de gestión de tenants (asistentes y salones)
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
  Building2, 
  UserCheck, 
  MoreVertical, 
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Tenant } from '@/hooks/useAdminData';

interface TenantsTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
}

const tenantTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  asistente: { label: 'Asistente', icon: UserCheck, className: 'bg-accent/10 text-accent' },
  salon: { label: 'Salón', icon: Building2, className: 'bg-secondary/10 text-secondary' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  activo: { label: 'Activo', className: 'badge-success' },
  inactivo: { label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
  suspendido: { label: 'Suspendido', className: 'badge-destructive' },
  pendiente: { label: 'Pendiente', className: 'badge-warning' },
};

export function TenantsTable({ tenants, isLoading }: TenantsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.nombre.toLowerCase().includes(search.toLowerCase()) ||
      tenant.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || tenant.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Tenants ({tenants.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={typeFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(null)}
            >
              Todos
            </Button>
            <Button
              variant={typeFilter === 'asistente' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('asistente')}
            >
              Asistentes
            </Button>
            <Button
              variant={typeFilter === 'salon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('salon')}
            >
              Salones
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay tenants que coincidan con la búsqueda
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => {
                const typeInfo = tenantTypeConfig[tenant.tipo] || tenantTypeConfig.asistente;
                const statusInfo = statusConfig[tenant.estado] || statusConfig.activo;
                const TypeIcon = typeInfo.icon;

                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.nombre}</p>
                        <p className="text-sm text-muted-foreground">{tenant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeInfo.className}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.pais}</TableCell>
                    <TableCell>
                      <span className={statusInfo.className}>{statusInfo.label}</span>
                    </TableCell>
                    <TableCell>
                      {tenant.tipo === 'asistente' && tenant.comision_asistente && (
                        <span>{tenant.comision_asistente}%</span>
                      )}
                      {tenant.tipo === 'salon' && tenant.precio_mensual && (
                        <span>{formatPrice(tenant.precio_mensual)}/mes</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tenant.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {tenant.estado === 'activo' ? (
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspender
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-success">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
