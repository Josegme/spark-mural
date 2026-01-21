/**
 * PICKEVENT - Dashboard del Salón
 * Panel completo para gestión de eventos y suscripción
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar,
  CalendarDays,
  CreditCard,
  Plus,
  RefreshCw,
  Loader2,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSalonData } from '@/hooks/useSalonData';
import { 
  SalonStats,
  SalonSubscription,
  SalonCalendar,
  SalonEventos,
  CreateSalonEventModal
} from '@/components/salon';

export default function SalonPage() {
  const { profile, signOut } = useAuth();
  const { stats, eventos, eventosCalendario, suscripcion, tenantInfo, isLoading, refetch } = useSalonData();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <MainLayout showFooter={false}>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              🏟️ {tenantInfo?.nombre || profile?.nombre || 'Mi Salón'}
            </h1>
            <p className="text-muted-foreground">
              Panel de gestión de eventos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
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
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
            <Button 
              className="btn-hero text-sm px-4 py-2" 
              onClick={() => setCreateModalOpen(true)}
              disabled={!stats.puedeCrearEvento}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="eventos" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="suscripcion" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalonStats 
                  stats={stats} 
                  isLoading={isLoading} 
                />
              </div>
              <div>
                <SalonSubscription 
                  suscripcion={suscripcion} 
                  stats={stats}
                  isLoading={isLoading} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="eventos">
            <SalonEventos 
              eventos={eventos} 
              isLoading={isLoading}
              puedeCrear={stats.puedeCrearEvento}
              onCreateEvent={() => setCreateModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="calendario">
            <SalonCalendar 
              eventos={eventosCalendario} 
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="suscripcion">
            <div className="max-w-md">
              <SalonSubscription 
                suscripcion={suscripcion} 
                stats={stats}
                isLoading={isLoading} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para crear evento */}
      <CreateSalonEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        tenantInfo={tenantInfo}
        stats={stats}
        onSuccess={() => {
          refetch();
          setCreateModalOpen(false);
        }}
      />
    </MainLayout>
  );
}
