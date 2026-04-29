/**
 * Dialog para reasignar el tenant_id de un perfil (asistente o salón).
 * Soporta tanto perfiles SIN tenant como perfiles con tenant huérfano (tenant_id que no existe).
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Building2, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AdminUser, Tenant } from '@/hooks/useAdminData';

interface ReassignTenantDialogProps {
  user: AdminUser | null;
  tenants: Tenant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  /** True si el usuario tenía un tenant_id que apunta a un tenant inexistente */
  isOrphan?: boolean;
}

export function ReassignTenantDialog({
  user,
  tenants,
  open,
  onOpenChange,
  onSaved,
  isOrphan = false,
}: ReassignTenantDialogProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelectedTenantId('');
  }, [open]);

  if (!user) return null;

  // Solo mostrar tenants del mismo tipo que el rol del usuario
  const compatibleTenants = tenants.filter((t) => t.tipo === user.rol);

  const handleSave = async () => {
    if (!selectedTenantId) {
      toast.error('Seleccioná un tenant primero');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tenant_id: selectedTenantId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log de auditoría
      await supabase.from('logs_auditoria').insert({
        accion: isOrphan ? 'tenant_reassigned_orphan' : 'tenant_assignment',
        tabla_afectada: 'profiles',
        registro_id: user.id,
        detalles: {
          previous_tenant_id: user.tenant_id,
          new_tenant_id: selectedTenantId,
          was_orphan: isOrphan,
        },
      });

      toast.success(
        isOrphan
          ? 'Tenant reasignado correctamente'
          : 'Tenant asignado correctamente'
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error('Error reasignando tenant:', err);
      toast.error('No se pudo guardar el cambio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOrphan ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : user.rol === 'salon' ? (
              <Building2 className="w-5 h-5" />
            ) : (
              <UserCheck className="w-5 h-5" />
            )}
            {isOrphan ? 'Reasignar Tenant' : 'Asignar Tenant'}
          </DialogTitle>
          <DialogDescription>
            <span className="block font-medium text-foreground">{user.nombre}</span>
            <span className="block text-xs">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        {isOrphan && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Este usuario tiene un <code className="text-xs">tenant_id</code> que apunta a un
              registro que ya no existe. Asignale uno válido para que pueda acceder a su dashboard.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">
            Seleccioná un tenant tipo &quot;{user.rol}&quot;
          </label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Elegir tenant..." />
            </SelectTrigger>
            <SelectContent>
              {compatibleTenants.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No hay tenants tipo {user.rol} disponibles
                </SelectItem>
              ) : (
                compatibleTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.tipo === 'salon' ? (
                      <Building2 className="w-4 h-4 inline mr-2" />
                    ) : (
                      <UserCheck className="w-4 h-4 inline mr-2" />
                    )}
                    {t.nombre}{' '}
                    <span className="text-xs text-muted-foreground">({t.email})</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedTenantId}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isOrphan ? 'Reasignar' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
