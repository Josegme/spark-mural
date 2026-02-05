/**
 * PICKEVENT - Dashboard del Asistente
 * Panel completo para gestión de eventos, clientes y comisiones
 * Adaptado al estilo del Dashboard del Salón
 */

import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  Wallet,
  Plus,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsistenteData } from '@/hooks/useAsistenteData';
import { 
  AsistenteStatsCards,
  AsistenteEventCards,
  AsistenteQuickActions,
  AsistenteEventos,
  AsistenteClientes,
  AsistenteRendiciones,
} from '@/components/asistente';

export default function AsistentePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { stats, eventos, clientes, rendiciones, tenantInfo, isLoading, refetch } = useAsistenteData();

  const handleCreateEvent = () => {
    if (stats.puedeCrearEvento) {
      navigate('/crear-evento');
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              👋 Hola, {profile?.nombre || 'Asistente'}
            </h1>
            <p className="text-muted-foreground">
              Panel de gestión de eventos y comisiones
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
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="eventos" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="rendiciones" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Rendiciones</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards con cuota y comisión */}
            <AsistenteStatsCards 
              stats={stats}
              limiteEventosMes={stats.limiteEventosMes}
              eventosUsados={stats.eventosUsados}
              isLoading={isLoading}
              comisionPorcentaje={tenantInfo?.comision_asistente ?? 50}
            />

            {/* Event Cards */}
            <AsistenteEventCards
              eventos={eventos}
              isLoading={isLoading}
              puedeCrear={stats.puedeCrearEvento}
              onCreateEvent={handleCreateEvent}
            />

            {/* Quick Actions */}
            <AsistenteQuickActions
              hasEvents={eventos.length > 0}
            />
          </TabsContent>

          {/* TAB: Eventos (tabla completa) */}
          <TabsContent value="eventos">
            <AsistenteEventos 
              eventos={eventos} 
              isLoading={isLoading}
              onCreateEvent={handleCreateEvent}
            />
          </TabsContent>

          {/* TAB: Clientes */}
          <TabsContent value="clientes">
            <AsistenteClientes 
              clientes={clientes} 
              isLoading={isLoading} 
            />
          </TabsContent>

          {/* TAB: Rendiciones */}
          <TabsContent value="rendiciones">
            <AsistenteRendiciones 
              rendiciones={rendiciones}
              stats={stats}
              isLoading={isLoading}
              onRefetch={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
