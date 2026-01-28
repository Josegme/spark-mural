/**
 * PICKEVENT - Dashboard del Cliente
 * Panel principal para usuarios autenticados
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus, LogOut } from 'lucide-react';
import { useUserEvents } from '@/hooks/useUserEvents';
import { 
  StatsCards, 
  EventsList, 
  QRCodesModal, 
  QuickActions 
} from '@/components/dashboard';
import type { UserEvent } from '@/hooks/useUserEvents';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { events, stats, isLoading } = useUserEvents();
  const [selectedEvent, setSelectedEvent] = useState<UserEvent | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Redirigir a la página correcta según el rol
  useEffect(() => {
    if (profile?.rol === 'salon') {
      navigate('/salon', { replace: true });
    } else if (profile?.rol === 'asistente') {
      navigate('/asistente', { replace: true });
    } else if (profile?.rol === 'super_admin') {
      navigate('/admin', { replace: true });
    }
  }, [profile?.rol, navigate]);

  const handleViewQR = (event: UserEvent) => {
    setSelectedEvent(event);
    setQrModalOpen(true);
  };

  const handleQuickQR = () => {
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setQrModalOpen(true);
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              👋 Hola, {profile?.nombre || 'Usuario'}
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
            <Button className="btn-hero text-sm px-4 py-2" asChild>
              <Link to="/crear-evento">
                <Plus className="w-4 h-4 mr-2" />
                Crear Evento
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards stats={stats} isLoading={isLoading} />
        </div>

        {/* Eventos Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Mis Eventos</h2>
            {events.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/crear-evento">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Link>
              </Button>
            )}
          </div>

          <EventsList 
            events={events} 
            isLoading={isLoading} 
            onViewQR={handleViewQR}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-display font-semibold">Acciones Rápidas</h2>
          <QuickActions 
            hasEvents={events.length > 0} 
            onOpenQRModal={handleQuickQR}
          />
        </div>
      </div>

      {/* QR Codes Modal */}
      <QRCodesModal
        event={selectedEvent}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </MainLayout>
  );
}
