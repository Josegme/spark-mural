/**
 * Tabla de gestión de tenants (asistentes y salones) - Versión mejorada
 * Con filtros avanzados, edición y creación
 */

import { useState, useEffect } from 'react';
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
  DropdownMenuSeparator,
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
  CheckCircle,
  Plus,
  AlertTriangle,
  Infinity,
  KeyRound,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Tenant } from '@/hooks/useAdminData';
import { TenantEditModal } from './TenantEditModal';
import { CreateTenantModal } from './CreateTenantModal';

interface TenantsTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const tenantTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  asistente: { label: 'Asistente', icon: UserCheck, className: 'bg-accent/10 text-accent' },
  salon: { label: 'Salón', icon: Building2, className: 'bg-secondary/10 text-secondary' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  activo: { label: 'Activo', className: 'badge-success' },
  inactivo: { label: 'Sin Usuario', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  suspendido: { label: 'Suspendido', className: 'badge-destructive' },
  moroso: { label: 'Moroso', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  pendiente: { label: 'Pendiente', className: 'badge-warning' },
};

export function TenantsTable({ tenants, isLoading, onRefresh }: TenantsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<Record<string, { nombre: string; email: string }>>({});

  // Fetch assigned user names for tenants that have usuario_asignado_id
  useEffect(() => {
    const userIds = tenants
      .map(t => t.usuario_asignado_id)
      .filter((id): id is string => !!id);
    
    if (userIds.length === 0) {
      // Fallback: find users by tenant_id
      const tenantIds = tenants.map(t => t.id);
      if (tenantIds.length === 0) return;
      
      supabase
        .from('profiles')
        .select('nombre, email, tenant_id')
        .in('tenant_id', tenantIds)
        .then(({ data }) => {
          if (!data) return;
          const map: Record<string, { nombre: string; email: string }> = {};
          data.forEach(p => {
            if (p.tenant_id) map[p.tenant_id] = { nombre: p.nombre, email: p.email };
          });
          setAssignedUsers(map);
        });
      return;
    }

    supabase
      .from('profiles')
      .select('id, nombre, email, tenant_id')
      .in('tenant_id', tenants.map(t => t.id))
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { nombre: string; email: string }> = {};
        data.forEach(p => {
          if (p.tenant_id) map[p.tenant_id] = { nombre: p.nombre, email: p.email };
        });
        setAssignedUsers(map);
      });
  }, [tenants]);

  // Handler: Restablecer contraseña
  const handleResetPassword = async (tenant: Tenant) => {
    const confirmed = window.confirm(
      `¿Seguro que querés restablecer la contraseña de "${tenant.nombre}"?\n\n` +
      'Se enviará un email con instrucciones para crear una nueva contraseña.'
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(tenant.email, {
        redirectTo: `${window.location.origin}/restablecer-password`
      });
      
      if (error) throw error;
      toast.success(`Email enviado a ${tenant.email}`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error('Error al enviar email de recuperación');
    }
  };

  // Handler: Suspender tenant
  const handleSuspend = async (tenant: Tenant) => {
    const confirmed = window.confirm(
      `Al suspender "${tenant.nombre}":\n\n` +
      '• No podrá crear nuevos eventos\n' +
      '• Los eventos existentes NO se afectan\n' +
      '• Puede reactivarse en cualquier momento\n\n' +
      '¿Continuar?'
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ estado: 'suspendido' })
        .eq('id', tenant.id);
      
      if (error) throw error;
      toast.success('Tenant suspendido correctamente');
      onRefresh?.();
    } catch (error: any) {
      console.error('Error suspending tenant:', error);
      toast.error('Error al suspender tenant');
    }
  };

  // Handler: Activar tenant
  const handleActivate = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ estado: 'activo' })
        .eq('id', tenant.id);
      
      if (error) throw error;
      toast.success('Tenant activado correctamente');
      onRefresh?.();
    } catch (error: any) {
      console.error('Error activating tenant:', error);
      toast.error('Error al activar tenant');
    }
  };

  // Handler: Eliminar tenant
  const handleDelete = async (tenant: Tenant) => {
    // Verificar eventos activos
    const { count: eventosActivos } = await supabase
      .from('eventos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .in('estado', ['activo', 'programado']);
    
    let mensaje = '';
    if (eventosActivos && eventosActivos > 0) {
      mensaje = 
        `⚠️ ADVERTENCIA: "${tenant.nombre}" tiene ${eventosActivos} eventos activos.\n\n` +
        'Al eliminar este tenant:\n' +
        '• Se eliminarán TODOS sus eventos\n' +
        '• Se eliminarán TODOS los contenidos de esos eventos\n' +
        '• Esta acción NO se puede deshacer\n\n' +
        'Escribí "ELIMINAR" para confirmar:';
    } else {
      mensaje = 
        `¿Seguro que querés eliminar a "${tenant.nombre}"?\n\n` +
        'Esta acción no se puede deshacer.\n\n' +
        'Escribí "ELIMINAR" para confirmar:';
    }
    
    const confirmacion = window.prompt(mensaje);
    
    if (confirmacion !== 'ELIMINAR') {
      toast.info('Eliminación cancelada');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);
      
      if (error) throw error;
      toast.success('Tenant eliminado correctamente');
      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      toast.error('Error al eliminar tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.nombre.toLowerCase().includes(search.toLowerCase()) ||
      tenant.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || tenant.tipo === typeFilter;
    const matchesStatus = !statusFilter || tenant.estado === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Contar tenants sin usuario asignado
  const sinAsignar = tenants.filter(t => t.estado === 'activo').length;
  const conProblemas = tenants.filter(t => t.estado === 'suspendido' || t.estado === 'moroso').length;

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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Tenants ({tenants.length})
              </CardTitle>
              {conProblemas > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {conProblemas} con problemas
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {/* Filtros de tipo */}
              <div className="flex items-center gap-1">
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

              {/* Botón crear */}
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Tenant
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
                  <TableHead>Comercial</TableHead>
                  <TableHead>Límites</TableHead>
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
                          {assignedUsers[tenant.id] ? (
                            <p className="text-xs text-primary mt-0.5">
                              👤 {assignedUsers[tenant.id].nombre} ({assignedUsers[tenant.id].email})
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500 mt-0.5">
                              ⚠ Sin usuario asignado
                            </p>
                          )}
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
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tenant.tipo === 'asistente' && tenant.comision_asistente !== null && (
                          <span className="text-sm">
                            {tenant.comision_asistente}/{100 - (tenant.comision_asistente || 50)}
                          </span>
                        )}
                        {tenant.tipo === 'salon' && tenant.precio_mensual !== null && (
                          <span className="text-sm">{formatPrice(tenant.precio_mensual)}/mes</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {tenant.limite_eventos_mes === -1 ? (
                            <Infinity className="w-4 h-4 text-primary" />
                          ) : (
                            <span>{tenant.limite_eventos_mes || 20}/mes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
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
                            {/* Opciones existentes */}
                            <DropdownMenuItem onClick={() => setEditingTenant(tenant)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Configuración
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Eventos
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Nuevas opciones */}
                            <DropdownMenuItem onClick={() => handleResetPassword(tenant)}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Restablecer Contraseña
                            </DropdownMenuItem>
                            
                            {tenant.estado === 'activo' ? (
                              <DropdownMenuItem onClick={() => handleSuspend(tenant)}>
                                <Pause className="w-4 h-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(tenant)}>
                                <Play className="w-4 h-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
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

      {/* Modal de edición */}
      <TenantEditModal
        tenant={editingTenant}
        open={!!editingTenant}
        onOpenChange={(open) => !open && setEditingTenant(null)}
        onSaved={() => {
          setEditingTenant(null);
          onRefresh?.();
        }}
      />

      {/* Modal de creación */}
      <CreateTenantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={() => {
          setShowCreateModal(false);
          onRefresh?.();
        }}
      />
    </>
  );
}
