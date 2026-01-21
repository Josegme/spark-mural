/**
 * PICKEVENT - Dashboard del Cliente
 * Panel principal para usuarios autenticados
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, QrCode, Download, Settings, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Eventos Activos</CardDescription>
              <CardTitle className="text-4xl font-display">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fotos Totales</CardDescription>
              <CardTitle className="text-4xl font-display">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mensajes Recibidos</CardDescription>
              <CardTitle className="text-4xl font-display">0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Eventos Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Mis Eventos</h2>
          </div>

          {/* Empty State */}
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Todavía no tenés eventos
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Creá tu primer evento y empezá a recibir fotos y mensajes de tus invitados en tiempo real.
              </p>
              <Button className="btn-hero" asChild>
                <Link to="/crear-evento">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Mi Primer Evento
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Ver QR Codes</CardTitle>
                <CardDescription>
                  Accedé a los códigos QR de tus eventos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                  <Download className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Descargar Álbumes</CardTitle>
                <CardDescription>
                  Descargá el contenido de tus eventos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <Settings className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Configuración</CardTitle>
                <CardDescription>
                  Editá tu perfil y preferencias
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
