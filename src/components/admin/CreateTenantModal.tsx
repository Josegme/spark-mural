/**
 * PICKEVENT - Modal para Crear Tenant
 * Crea un nuevo tenant (asistente o salón) opcionalmente con usuario asignado
 */

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Building2, UserCheck, Mail, Lock } from 'lucide-react';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

interface CreateTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type TenantType = 'asistente' | 'salon';

export function CreateTenantModal({ open, onOpenChange, onCreated }: CreateTenantModalProps) {
  const { toast } = useToast();
  const { config } = useGlobalConfig();
  const [creating, setCreating] = useState(false);
  const [tipo, setTipo] = useState<TenantType>('asistente');
  const [createUser, setCreateUser] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    pais: 'Argentina',
    // Usuario (opcional)
    user_email: '',
    user_password: '',
    user_nombre: '',
    // Comercial
    comision_asistente: 50,
    precio_mensual: 150000,
    limite_eventos_mes: 30,
    // Notas
    notas_trato: '',
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      pais: 'Argentina',
      user_email: '',
      user_password: '',
      user_nombre: '',
      comision_asistente: 50,
      precio_mensual: 150000,
      limite_eventos_mes: tipo === 'asistente' 
        ? (config?.limites_default?.eventos_mes_asistente || 30)
        : (config?.limites_default?.eventos_mes_salon || 20),
      notas_trato: '',
    });
    setCreateUser(false);
  };

  const handleCreate = async () => {
    if (!formData.nombre || !formData.email) {
      toast({
        title: 'Error',
        description: 'Nombre y email del tenant son requeridos',
        variant: 'destructive',
      });
      return;
    }

    if (createUser && (!formData.user_email || !formData.user_password)) {
      toast({
        title: 'Error',
        description: 'Email y contraseña del usuario son requeridos',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      let userId: string | null = null;

      // 1. Crear usuario si se solicitó
      if (createUser) {
        // Usar la edge function para crear usuario sin afectar la sesión actual
        const { data: userData, error: userError } = await supabase.functions.invoke('create-test-users', {
          body: {
            users: [{
              email: formData.user_email,
              password: formData.user_password,
              nombre: formData.user_nombre || formData.nombre,
              rol: tipo,
            }]
          }
        });

        if (userError) throw userError;
        
        if (userData?.created?.[0]) {
          userId = userData.created[0].id;
        }
      }

      // 2. Crear el tenant
      const tenantData: Record<string, unknown> = {
        nombre: formData.nombre,
        email: formData.email,
        pais: formData.pais,
        tipo,
        estado: 'activo',
        limite_eventos_mes: formData.limite_eventos_mes,
        eventos_cortesia_disponibles: config?.limites_default?.cortesias_iniciales || 2,
        notas_trato: formData.notas_trato || null,
      };

      if (tipo === 'asistente') {
        tenantData.comision_asistente = formData.comision_asistente;
        tenantData.comision_superadmin = 100 - formData.comision_asistente;
      } else {
        tenantData.precio_mensual = formData.precio_mensual;
      }

      if (userId) {
        tenantData.usuario_asignado_id = userId;
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([tenantData as { nombre: string; email: string; tipo: 'asistente' | 'salon' }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Si se creó usuario, asignar tenant_id al perfil
      if (userId && tenant) {
        await supabase
          .from('profiles')
          .update({ 
            tenant_id: tenant.id,
            rol: tipo,
          })
          .eq('id', userId);
      }

      // Log de auditoría
      await supabase.from('logs_auditoria').insert([{
        accion: 'tenant_created',
        tabla_afectada: 'tenants',
        registro_id: tenant.id,
        detalles: { 
          tipo, 
          with_user: createUser,
          user_id: userId 
        }
      }]);

      toast({
        title: 'Tenant creado',
        description: createUser 
          ? `${formData.nombre} creado con usuario ${formData.user_email}`
          : `${formData.nombre} creado (sin usuario asignado)`,
      });

      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error creating tenant:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear el tenant';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear Nuevo Tenant
          </DialogTitle>
          <DialogDescription>
            Creá un asistente o salón, opcionalmente con usuario asignado
          </DialogDescription>
        </DialogHeader>

        {/* Tipo de Tenant */}
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as TenantType)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="asistente" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Asistente
            </TabsTrigger>
            <TabsTrigger value="salon" className="gap-2">
              <Building2 className="w-4 h-4" />
              Salón
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tipo} className="space-y-4 mt-4">
            {/* Datos del Tenant */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del {tipo === 'asistente' ? 'Asistente' : 'Salón'}</Label>
                  <Input
                    placeholder={tipo === 'asistente' ? 'Juan Pérez' : 'Salón Las Palmas'}
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de Contacto</Label>
                  <Input
                    type="email"
                    placeholder="contacto@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>País</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.pais}
                    onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Brasil">Brasil</option>
                    <option value="España">España</option>
                    <option value="Nueva Zelanda">Nueva Zelanda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {tipo === 'asistente' ? 'Comisión (%)' : 'Precio Mensual (ARS)'}
                  </Label>
                  {tipo === 'asistente' ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.comision_asistente}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        comision_asistente: parseInt(e.target.value) || 50 
                      }))}
                    />
                  ) : (
                    <Input
                      type="number"
                      value={formData.precio_mensual}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        precio_mensual: parseInt(e.target.value) || 0 
                      }))}
                    />
                  )}
                </div>
              </div>

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
            </div>

            {/* Opción de crear usuario */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <Label>Crear Usuario Ahora</Label>
                <p className="text-sm text-muted-foreground">
                  Creá las credenciales de acceso al sistema
                </p>
              </div>
              <Switch
                checked={createUser}
                onCheckedChange={setCreateUser}
              />
            </div>

            {/* Campos de usuario */}
            {createUser && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Credenciales de Acceso
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Email del Usuario</Label>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={formData.user_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del Usuario</Label>
                    <Input
                      placeholder="Nombre completo"
                      value={formData.user_nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_nombre: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.user_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_password: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas del Trato (opcional)</Label>
              <Textarea
                placeholder="Detalles del acuerdo comercial..."
                value={formData.notas_trato}
                onChange={(e) => setFormData(prev => ({ ...prev, notas_trato: e.target.value }))}
                rows={2}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Crear {tipo === 'asistente' ? 'Asistente' : 'Salón'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
