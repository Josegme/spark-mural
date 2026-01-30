/**
 * PICKEVENT - Modal de Edición de Tenant
 * Permite editar comisiones, permisos, precios y asignación de usuarios
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  User, 
  Percent, 
  DollarSign, 
  Calendar,
  Shield,
  Building2,
  UserCheck
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Tenant } from '@/hooks/useAdminData';

interface TenantEditModalProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function TenantEditModal({ tenant, open, onOpenChange, onSaved }: TenantEditModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    pais: 'Argentina',
    estado: 'activo',
    // Comisiones (solo asistentes)
    comision_asistente: 50,
    comision_superadmin: 50,
    // Permisos
    puede_modificar_precios: false,
    eventos_ilimitados: false,
    // Precios personalizados
    precio_evento_basico: null as number | null,
    precio_evento_premium: null as number | null,
    // Límites
    limite_eventos_mes: 20,
    eventos_cortesia_disponibles: 2,
    // Suscripción (solo salones)
    precio_mensual: null as number | null,
    duracion_suscripcion_meses: null as number | null,
    fecha_vencimiento: null as string | null,
    // Notas
    notas_trato: '',
  });

  // Sincronizar con tenant seleccionado
  useEffect(() => {
    if (tenant) {
      setFormData({
        nombre: tenant.nombre,
        email: tenant.email,
        pais: tenant.pais,
        estado: tenant.estado,
        comision_asistente: tenant.comision_asistente || 50,
        comision_superadmin: tenant.comision_superadmin || 50,
        puede_modificar_precios: false, // Se cargará del tenant extendido
        eventos_ilimitados: false,
        precio_evento_basico: null,
        precio_evento_premium: null,
        limite_eventos_mes: tenant.limite_eventos_mes || 20,
        eventos_cortesia_disponibles: 2,
        precio_mensual: tenant.precio_mensual,
        duracion_suscripcion_meses: null,
        fecha_vencimiento: tenant.fecha_vencimiento,
        notas_trato: '',
      });

      // Cargar datos extendidos
      loadExtendedData(tenant.id);
    }
  }, [tenant]);

  const loadExtendedData = async (tenantId: string) => {
    const { data } = await supabase
      .from('tenants')
      .select('puede_modificar_precios, eventos_ilimitados, precio_evento_basico, precio_evento_premium, duracion_suscripcion_meses, notas_trato, eventos_cortesia_disponibles')
      .eq('id', tenantId)
      .single();

    if (data) {
      setFormData(prev => ({
        ...prev,
        puede_modificar_precios: data.puede_modificar_precios || false,
        eventos_ilimitados: data.eventos_ilimitados || false,
        precio_evento_basico: data.precio_evento_basico,
        precio_evento_premium: data.precio_evento_premium,
        duracion_suscripcion_meses: data.duracion_suscripcion_meses,
        notas_trato: data.notas_trato || '',
        eventos_cortesia_disponibles: data.eventos_cortesia_disponibles || 2,
      }));
    }
  };

  const handleSave = async () => {
    if (!tenant) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        nombre: formData.nombre,
        email: formData.email,
        pais: formData.pais,
        estado: formData.estado,
        limite_eventos_mes: formData.limite_eventos_mes,
        eventos_cortesia_disponibles: formData.eventos_cortesia_disponibles,
        puede_modificar_precios: formData.puede_modificar_precios,
        eventos_ilimitados: formData.eventos_ilimitados,
        notas_trato: formData.notas_trato || null,
        updated_at: new Date().toISOString(),
      };

      // Campos específicos por tipo
      if (tenant.tipo === 'asistente') {
        updateData.comision_asistente = formData.comision_asistente;
        updateData.comision_superadmin = 100 - formData.comision_asistente;
        updateData.precio_evento_basico = formData.precio_evento_basico;
        updateData.precio_evento_premium = formData.precio_evento_premium;
      } else {
        // Salón
        updateData.precio_mensual = formData.precio_mensual;
        updateData.duracion_suscripcion_meses = formData.duracion_suscripcion_meses;
        if (formData.fecha_vencimiento) {
          updateData.fecha_vencimiento = formData.fecha_vencimiento;
        }
      }

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenant.id);

      if (error) throw error;

      // Log de auditoría
      await supabase.from('logs_auditoria').insert([{
        accion: 'tenant_updated',
        tabla_afectada: 'tenants',
        registro_id: tenant.id,
        detalles: JSON.parse(JSON.stringify({ changes: updateData }))
      }]);

      toast({
        title: 'Tenant actualizado',
        description: `${tenant.nombre} fue actualizado correctamente`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar los cambios',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return null;

  const isAsistente = tenant.tipo === 'asistente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAsistente ? <UserCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            Editar {isAsistente ? 'Asistente' : 'Salón'}: {tenant.nombre}
          </DialogTitle>
          <DialogDescription>
            Configurá comisiones, permisos y condiciones especiales
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="comercial">
              {isAsistente ? 'Comisiones' : 'Suscripción'}
            </TabsTrigger>
            <TabsTrigger value="permisos">Permisos</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input
                  value={formData.pais}
                  onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="moroso">Moroso</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas del Trato</Label>
              <Textarea
                placeholder="Ej: Acuerdo especial primer mes 70/30, luego 50/50..."
                value={formData.notas_trato}
                onChange={(e) => setFormData(prev => ({ ...prev, notas_trato: e.target.value }))}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Comercial */}
          <TabsContent value="comercial" className="space-y-4 mt-4">
            {isAsistente ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Split de Comisiones</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Comisión Asistente (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.comision_asistente}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          setFormData(prev => ({
                            ...prev,
                            comision_asistente: val,
                            comision_superadmin: 100 - val
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comisión Super Admin (%)</Label>
                      <Input
                        type="number"
                        value={100 - formData.comision_asistente}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <Label className="text-base font-semibold">Precios Personalizados</Label>
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dejá vacío para usar precios globales
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio Básico (ARS)</Label>
                      <Input
                        type="number"
                        placeholder="Usar global"
                        value={formData.precio_evento_basico || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          precio_evento_basico: e.target.value ? parseInt(e.target.value) : null
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio Premium (ARS)</Label>
                      <Input
                        type="number"
                        placeholder="Usar global"
                        value={formData.precio_evento_premium || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          precio_evento_premium: e.target.value ? parseInt(e.target.value) : null
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Límite Eventos/Mes</Label>
                    <Input
                      type="number"
                      value={formData.limite_eventos_mes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limite_eventos_mes: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cortesías Disponibles</Label>
                    <Input
                      type="number"
                      value={formData.eventos_cortesia_disponibles}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventos_cortesia_disponibles: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Salón */
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Suscripción</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio Mensual (ARS)</Label>
                      <Input
                        type="number"
                        value={formData.precio_mensual || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          precio_mensual: e.target.value ? parseInt(e.target.value) : null
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duración (meses)</Label>
                      <Input
                        type="number"
                        placeholder="Ej: 12 para anual"
                        value={formData.duracion_suscripcion_meses || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          duracion_suscripcion_meses: e.target.value ? parseInt(e.target.value) : null
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fecha_vencimiento?.split('T')[0] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fecha_vencimiento: e.target.value ? new Date(e.target.value).toISOString() : null
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Límite Eventos/Mes</Label>
                    <Input
                      type="number"
                      value={formData.limite_eventos_mes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limite_eventos_mes: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cortesías Disponibles</Label>
                    <Input
                      type="number"
                      value={formData.eventos_cortesia_disponibles}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        eventos_cortesia_disponibles: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Permisos */}
          <TabsContent value="permisos" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Permisos Especiales</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Puede Modificar Precios</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite al {isAsistente ? 'asistente' : 'salón'} cambiar precios de eventos
                  </p>
                </div>
                <Switch
                  checked={formData.puede_modificar_precios}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    puede_modificar_precios: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Eventos Ilimitados</Label>
                  <p className="text-sm text-muted-foreground">
                    Sin límite mensual de eventos (ideal para tratos especiales)
                  </p>
                </div>
                <Switch
                  checked={formData.eventos_ilimitados}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    eventos_ilimitados: checked
                  }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
