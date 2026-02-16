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
  Settings,
  RefreshCw,
  Loader2,
  UserPlus,
  LogOut,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminStats, TenantsTable, UsersTable, LaunchChecklist } from '@/components/admin';
import TenantAssignment from '@/components/admin/TenantAssignment';
import { GlobalConfigPanel } from '@/components/admin/GlobalConfigPanel';
import { AdminEventsList } from '@/components/admin/AdminEventsList';

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
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="eventos" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
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
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
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

          <TabsContent value="eventos">
            <AdminEventsList />
          </TabsContent>

          <TabsContent value="tenants">
            <TenantsTable tenants={tenants} isLoading={isLoading} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable users={users} tenants={tenants} isLoading={isLoading} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="assign">
            <TenantAssignment />
          </TabsContent>

          <TabsContent value="config">
            <GlobalConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
