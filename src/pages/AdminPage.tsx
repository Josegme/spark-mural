/**
 * PICKEVENT - Panel de Administración Super Admin
 * Dashboard completo para gestión del sistema
 */

import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText,
  RefreshCw,
  Loader2,
  UserPlus,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminStats, TenantsTable, UsersTable, LaunchChecklist } from '@/components/admin';
import TenantAssignment from '@/components/admin/TenantAssignment';

export default function AdminPage() {
  const { signOut } = useAuth();
  const { stats, tenants, users, isLoading, refetch } = useAdminData();

  return (
    <MainLayout showFooter={false}>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestión global del sistema PICKEVENT
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualizar
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="assign" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Asignar</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AdminStats stats={stats} isLoading={isLoading} />
              </div>
              <div>
                <LaunchChecklist />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tenants">
            <TenantsTable tenants={tenants} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable users={users} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="assign">
            <TenantAssignment />
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Reportes y rendiciones - Próximamente</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
