/**
 * Modal de gestión completa de un usuario para Super Admin.
 * Incluye: Ver perfil, Editar datos, Cambiar rol, Suspender (Danger Zone).
 */

import { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  User,
  Shield,
  AlertTriangle,
  Eye,
  Edit,
  UserCog,
  Mail,
  Phone,
  Globe,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AdminUser, Tenant } from '@/hooks/useAdminData';

type CrudMode = 'view' | 'edit' | 'role';

interface UserCrudModalProps {
  user: AdminUser | null;
  tenant?: Tenant;
  initialMode?: CrudMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  asistente: 'Asistente',
  salon: 'Salón',
  cliente: 'Cliente',
};

export function UserCrudModal({
  user,
  tenant,
  initialMode = 'view',
  open,
  onOpenChange,
  onSaved,
}: UserCrudModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [tab, setTab] = useState<CrudMode>(initialMode);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: '',
    new_role: '' as string,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: '',
        pais: user.pais || '',
        new_role: user.rol,
      });
      setTab(initialMode);
      // Cargar telefono completo del perfil
      supabase
        .from('profiles')
        .select('telefono')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.telefono) {
            setFormData((prev) => ({ ...prev, telefono: data.telefono || '' }));
          }
        });
    }
  }, [user, initialMode]);

  if (!user) return null;

  const callAdminFn = async (
    action: string,
    payload?: Record<string, unknown>,
  ) => {
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: { action, target_user_id: user.id, payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await callAdminFn('update_profile', {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono || null,
        pais: formData.pais,
      });
      toast({ title: 'Perfil actualizado', description: 'Los datos fueron guardados.' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo actualizar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async () => {
    if (formData.new_role === user.rol) {
      toast({ title: 'Sin cambios', description: 'El rol seleccionado es el actual.' });
      return;
    }
    setSaving(true);
    try {
      await callAdminFn('change_role', { new_role: formData.new_role });
      toast({
        title: 'Rol actualizado',
        description: `${user.nombre} ahora es ${ROLE_LABELS[formData.new_role]}.`,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cambiar el rol',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    setSaving(true);
    try {
      const data = await callAdminFn('suspend_user');
      toast({
        title: 'Usuario suspendido',
        description: data?.warning || 'El tenant asociado fue marcado como suspendido.',
      });
      setConfirmSuspend(false);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo suspender',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    setSaving(true);
    try {
      await callAdminFn('reactivate_user');
      toast({ title: 'Usuario reactivado' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo reactivar',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent desktopClassName="max-w-2xl">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Gestionar Usuario: {user.nombre}
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              <Badge variant="outline" className="mr-2">
                {ROLE_LABELS[user.rol] || user.rol}
              </Badge>
              {user.email}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as CrudMode)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="view">
                <Eye className="w-4 h-4 mr-1" /> Ver
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Edit className="w-4 h-4 mr-1" /> Editar
              </TabsTrigger>
              <TabsTrigger value="role">
                <UserCog className="w-4 h-4 mr-1" /> Cambiar Rol
              </TabsTrigger>
            </TabsList>

            {/* VER */}
            <TabsContent value="view" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Nombre
                  </Label>
                  <p className="font-medium">{user.nombre}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Teléfono
                  </Label>
                  <p className="font-medium">{formData.telefono || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" /> País
                  </Label>
                  <p className="font-medium">{user.pais || '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Rol
                  </Label>
                  <p className="font-medium">{ROLE_LABELS[user.rol] || user.rol}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Registrado
                  </Label>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>
              {tenant && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <Label className="text-muted-foreground">Tenant asociado</Label>
                    <p className="font-medium">
                      🏢 {tenant.nombre}{' '}
                      <Badge variant="outline" className="ml-1">{tenant.tipo}</Badge>{' '}
                      <Badge
                        className={
                          tenant.estado === 'activo'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-destructive/10 text-destructive'
                        }
                      >
                        {tenant.estado}
                      </Badge>
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* EDITAR */}
            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))}
                    placeholder="+54 9 11..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input
                    value={formData.pais}
                    onChange={(e) => setFormData((p) => ({ ...p, pais: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </Button>
            </TabsContent>

            {/* CAMBIAR ROL */}
            <TabsContent value="role" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nuevo Rol</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.new_role}
                  onChange={(e) => setFormData((p) => ({ ...p, new_role: e.target.value }))}
                >
                  <option value="cliente">Cliente Final</option>
                  <option value="salon">Salón</option>
                  <option value="asistente">Asistente</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Cambiar a Asistente o Salón requiere asignar un tenant después.
                </p>
              </div>
              <Button onClick={handleChangeRole} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCog className="w-4 h-4 mr-2" />}
                Aplicar Cambio de Rol
              </Button>
            </TabsContent>
          </Tabs>

          {/* Danger Zone */}
          <Separator className="my-6" />
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <Label className="font-semibold">Zona de Peligro</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Suspender bloquea el acceso del tenant asociado sin borrar datos históricos.
            </p>
            <div className="flex gap-2">
              {tenant?.estado === 'suspendido' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={saving}
                >
                  Reactivar Usuario
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmSuspend(true)}
                  disabled={saving || !tenant}
                >
                  Suspender Usuario
                </Button>
              )}
              {!tenant && (
                <p className="text-xs text-muted-foreground self-center">
                  Sin tenant asociado: nada que suspender.
                </p>
              )}
            </div>
          </div>

          <ResponsiveModalFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Suspender a {user.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              El tenant asociado pasará a estado <strong>suspendido</strong>. El usuario no podrá
              operar pero los datos históricos se conservan. Podés reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
