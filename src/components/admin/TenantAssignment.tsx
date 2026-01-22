/**
 * PICKEVENT - Componente de Asignación de Tenants
 * Permite al Super Admin asignar tenants a usuarios asistente/salon sin tenant_id
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  tenant_id: string | null;
}

interface Tenant {
  id: string;
  nombre: string;
  tipo: string;
}

export default function TenantAssignment() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<{ [key: string]: string }>({});
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar usuarios sin tenant_id que requieren uno
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, email, rol, tenant_id')
        .in('rol', ['asistente', 'salon'])
        .is('tenant_id', null)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
      }

      // Cargar todos los tenants disponibles
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, nombre, tipo')
        .order('nombre');

      if (tenantsError) {
        console.error("Error loading tenants:", tenantsError);
      }

      setProfiles(profilesData || []);
      setTenants(tenantsData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (profileId: string) => {
    const tenantId = selectedTenant[profileId];
    if (!tenantId) {
      toast({
        title: "Error",
        description: "Selecciona un tenant primero",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(profileId);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          tenant_id: tenantId,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tenant asignado correctamente",
      });

      // Log de auditoría
      await supabase.from('logs_auditoria').insert({
        accion: 'tenant_assignment',
        tabla_afectada: 'profiles',
        registro_id: profileId,
        detalles: { tenant_id: tenantId, assigned_by: 'super_admin' }
      });

      // Recargar datos
      await loadData();
      
      // Limpiar selección
      setSelectedTenant(prev => {
        const newState = { ...prev };
        delete newState[profileId];
        return newState;
      });

    } catch (error) {
      console.error("Error asignando tenant:", error);
      toast({
        title: "Error",
        description: "No se pudo asignar el tenant",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  const getRolBadgeVariant = (rol: string) => {
    switch (rol) {
      case 'asistente':
        return 'default';
      case 'salon':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTenantIcon = (tipo: string) => {
    return tipo === 'salon' ? Building2 : Users;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Asignación de Tenants
          </CardTitle>
          <CardDescription>
            Todos los usuarios tienen tenant asignado correctamente ✓
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>
              No hay usuarios pendientes de asignación. Los roles "asistente" y "salon" 
              requieren un tenant para acceder a sus dashboards.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Usuarios sin Tenant Asignado
        </CardTitle>
        <CardDescription>
          Los siguientes usuarios requieren ser asignados a un tenant para acceder a sus dashboards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div 
              key={profile.id} 
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <p className="font-medium">{profile.nombre}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant={getRolBadgeVariant(profile.rol)} className="mt-1">
                  {profile.rol}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  value={selectedTenant[profile.id] || ''}
                  onValueChange={(value) =>
                    setSelectedTenant(prev => ({ ...prev, [profile.id]: value }))
                  }
                >
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Seleccionar tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants
                      .filter(t => t.tipo === profile.rol) // Solo mostrar tenants del mismo tipo
                      .map((tenant) => {
                        const TenantIcon = getTenantIcon(tenant.tipo);
                        return (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div className="flex items-center gap-2">
                              <TenantIcon className="w-4 h-4" />
                              <span>{tenant.nombre}</span>
                              <Badge variant="outline" className="ml-1 text-xs">
                                {tenant.tipo}
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    {tenants.filter(t => t.tipo === profile.rol).length === 0 && (
                      <SelectItem value="none" disabled>
                        No hay tenants de tipo {profile.rol}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => handleAssign(profile.id)}
                  disabled={!selectedTenant[profile.id] || assigning === profile.id}
                >
                  {assigning === profile.id ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Alert className="mt-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Importante:</strong> Los usuarios con rol "asistente" deben asignarse a tenants 
            de tipo "asistente", y los usuarios "salon" a tenants de tipo "salon".
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
