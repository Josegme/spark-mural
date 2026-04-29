/**
 * Tabla de gestión de usuarios
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  MoreVertical, 
  Search,
  Eye,
  Edit,
  Shield,
  UserCog,
  Settings2,
  AlertTriangle,
  Link2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AdminUser, Tenant } from '@/hooks/useAdminData';
import { TenantEditModal } from './TenantEditModal';
import { ReassignTenantDialog } from './ReassignTenantDialog';
import { UserCrudModal } from './UserCrudModal';

interface UsersTableProps {
  users: AdminUser[];
  tenants: Tenant[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-primary/10 text-primary' },
  asistente: { label: 'Asistente', className: 'bg-accent/10 text-accent' },
  salon: { label: 'Salón', className: 'bg-secondary/10 text-secondary' },
  cliente: { label: 'Cliente', className: 'bg-muted text-muted-foreground' },
};

export function UsersTable({ users, tenants, isLoading, onRefresh }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [reassignTarget, setReassignTarget] = useState<{ user: AdminUser; isOrphan: boolean } | null>(null);
  const [crudTarget, setCrudTarget] = useState<{ user: AdminUser; mode: 'view' | 'edit' | 'role' } | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombre.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Contar por rol
  const roleCounts = users.reduce((acc, user) => {
    acc[user.rol] = (acc[user.rol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Helper to find tenant for a user
  const findTenantForUser = (user: AdminUser): Tenant | undefined => {
    if (!user.tenant_id) return undefined;
    return tenants.find(t => t.id === user.tenant_id);
  };

  /**
   * Un perfil con rol asistente/salon que tiene tenant_id pero el tenant
   * no existe en la tabla tenants. Estado inconsistente que bloquea su acceso.
   */
  const isOrphanTenant = (user: AdminUser): boolean => {
    if (user.rol !== 'asistente' && user.rol !== 'salon') return false;
    if (!user.tenant_id) return false;
    return !tenants.find(t => t.id === user.tenant_id);
  };

  /** Necesita asignación: rol asistente/salon SIN tenant_id */
  const needsAssignment = (user: AdminUser): boolean => {
    return (user.rol === 'asistente' || user.rol === 'salon') && !user.tenant_id;
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios ({users.length})
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
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
                variant={roleFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(null)}
              >
                Todos
              </Button>
              {Object.entries(roleConfig).map(([role, config]) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {config.label} ({roleCounts[role] || 0})
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay usuarios que coincidan con la búsqueda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = roleConfig[user.rol] || roleConfig.cliente;
                  const userTenant = findTenantForUser(user);
                  const orphan = isOrphanTenant(user);
                  const unassigned = needsAssignment(user);

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.nombre}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {userTenant && (
                            <p className="text-xs text-primary mt-0.5">
                              🏢 {userTenant.nombre}
                            </p>
                          )}
                          {orphan && (
                            <p className="text-xs text-destructive mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Tenant huérfano (id inválido)
                            </p>
                          )}
                          {unassigned && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Sin tenant asignado
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleInfo.className}>
                          {user.rol === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.pais || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setCrudTarget({ user, mode: 'view' })}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCrudTarget({ user, mode: 'edit' })}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCrudTarget({ user, mode: 'role' })}>
                              <UserCog className="w-4 h-4 mr-2" />
                              Cambiar Rol
                            </DropdownMenuItem>
                            {userTenant && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditingTenant(userTenant)}>
                                  <Settings2 className="w-4 h-4 mr-2" />
                                  Configurar Tenant
                                </DropdownMenuItem>
                              </>
                            )}
                            {(orphan || unassigned) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setReassignTarget({ user, isOrphan: orphan })}
                                  className={orphan ? 'text-destructive focus:text-destructive' : ''}
                                >
                                  <Link2 className="w-4 h-4 mr-2" />
                                  {orphan ? 'Reasignar Tenant' : 'Asignar Tenant'}
                                </DropdownMenuItem>
                              </>
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

      {/* Modal de edición de tenant desde la tabla de usuarios */}
      <TenantEditModal
        tenant={editingTenant}
        open={!!editingTenant}
        onOpenChange={(open) => !open && setEditingTenant(null)}
        onSaved={() => {
          setEditingTenant(null);
          onRefresh?.();
        }}
      />

      {/* Dialog para asignar / reasignar tenant cuando está huérfano o sin asignar */}
      <ReassignTenantDialog
        user={reassignTarget?.user ?? null}
        tenants={tenants}
        isOrphan={reassignTarget?.isOrphan ?? false}
        open={!!reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
        onSaved={() => {
          setReassignTarget(null);
          onRefresh?.();
        }}
      />
    </>
  );
}
