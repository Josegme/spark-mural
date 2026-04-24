/**
 * PICKEVENT - Dashboard del Salón
 * Panel completo para gestión de eventos y suscripción
 */

import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar,
  CreditCard,
  Plus,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSalonData } from '@/hooks/useSalonData';
import { 
  SalonStats,
  SalonSubscription,
  SalonEventos,
  SalonEventCards,
  SalonQuickActions,
  SubscriptionPaymentWidget,
  SalonGuide
} from '@/components/salon';
import { PageSkeleton } from '@/components/ui/skeletons';

export default function SalonPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { stats, eventos, eventosCalendario, suscripcion, tenantInfo, isLoading, refetch } = useSalonData();

  const handleCreateEvent = () => {
    if (stats.puedeCrearEvento) {
      navigate('/crear-evento');
    }
  };

  if (isLoading) {
    return (
      <MainLayout showFooter={false}>
        <PageSkeleton />
      </MainLayout>
    );
  }

  if (!isLoading && !tenantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">🏛️</div>
          <h2 className="text-2xl font-bold">Cuenta pendiente de activación</h2>
          <p className="text-muted-foreground">
            Tu cuenta de salón aún no tiene un plan asignado. 
            Contactá a PickEvent para activar tu suscripción.
          </p>
          <p className="text-sm text-muted-foreground">
            📧 Escribinos y te configuramos en menos de 24 horas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout showFooter={false}>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-fluid-3xl font-display font-bold">
              👋 Hola, {tenantInfo?.nombre || profile?.nombre || 'Mi Salón'}
            </h1>
            <p className="text-muted-foreground">
              Gestioná tus eventos desde acá
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
            <Button 
              className="btn-hero text-sm px-4 py-2" 
              onClick={handleCreateEvent}
              disabled={!stats.puedeCrearEvento}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="eventos" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="suscripcion" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-8">
              {/* Stats Cards */}
              <SalonStats 
                stats={stats} 
                isLoading={isLoading} 
              />

              {/* Event Cards (estilo dashboard) */}
              <SalonEventCards 
                eventos={eventos}
                isLoading={isLoading}
                puedeCrear={stats.puedeCrearEvento}
                onCreateEvent={handleCreateEvent}
              />

              {/* Quick Actions */}
              <div className="space-y-4">
                <h2 className="text-xl font-display font-semibold">Acciones Rápidas</h2>
                <SalonQuickActions hasEvents={eventos.length > 0} />
              </div>

              {/* Subscription Widget - al final */}
              <SubscriptionPaymentWidget 
                suscripcion={suscripcion}
                stats={stats}
                tenantInfo={tenantInfo}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="eventos">
            <SalonEventos 
              eventos={eventos} 
              isLoading={isLoading}
              puedeCrear={stats.puedeCrearEvento}
              onCreateEvent={handleCreateEvent}
            />
          </TabsContent>

          <TabsContent value="suscripcion">
            <div className="space-y-6">
              <div className="max-w-md">
                <SalonSubscription 
                  suscripcion={suscripcion} 
                  stats={stats}
                  isLoading={isLoading} 
                />
              </div>
              <SalonGuide />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
