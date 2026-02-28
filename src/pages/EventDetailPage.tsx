/**
 * PICKEVENT - Detalle del Evento
 * Página completa de gestión de un evento específico
 */

import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, LayoutGrid, Shield, Settings, Download, Gamepad2 } from 'lucide-react';
import { useEventDetails } from '@/hooks/useEventDetails';
import { QRCodesModal } from '@/components/dashboard/QRCodesModal';
import {
  EventHeader,
  ContentGrid,
  EventSettings,
  AlbumDownload,
} from '@/components/event-detail';
import { EventGames } from '@/components/event-detail/EventGames';
import type { UserEvent } from '@/hooks/useUserEvents';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { event, content, isLoading, error, moderate, updateEvent, changeStatus, deleteEvent, isUpdating, isDeleting } = useEventDetails(id);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !event) {
    return <Navigate to="/dashboard" replace />;
  }

  // Convertir a UserEvent para el modal de QR
  const eventForQR: UserEvent = {
    id: event.id,
    nombre: event.nombre,
    tipo: event.tipo,
    fecha_evento: event.fecha_evento,
    hora_inicio: event.hora_inicio,
    duracion_horas: event.duracion_horas,
    estado: event.estado,
    es_premium: event.es_premium,
    qr_pantalla_token: event.qr_pantalla_token,
    qr_invitados_token: event.qr_invitados_token,
    qr_descarga_token: event.qr_descarga_token,
    color_banner: event.color_banner,
    logo_url: event.logo_url,
    total_fotos: event.total_fotos,
    total_videos: event.total_videos,
    total_mensajes: event.total_mensajes,
    total_likes: event.total_likes,
    album_disponible_hasta: event.album_disponible_hasta,
    created_at: event.created_at,
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-6">
        <EventHeader
          event={event}
          onChangeStatus={changeStatus}
          onOpenQR={() => setQrModalOpen(true)}
          isUpdating={isUpdating}
        />

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-5">
            <TabsTrigger value="content" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Contenido</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Moderación</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">Juegos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="download" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Álbum</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentGrid
              content={content.filter(c => c.aprobado)}
              onModerate={(contentId, aprobado) => moderate({ contentId, aprobado })}
              showModeration={false}
            />
          </TabsContent>

          <TabsContent value="moderation">
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">
                    {event.moderacion_activa 
                      ? 'La moderación está activa. El contenido requiere aprobación antes de aparecer en el muro.'
                      : 'La moderación está desactivada. Todo el contenido aparece automáticamente.'}
                  </p>
                </CardContent>
              </Card>
              <ContentGrid
                content={content}
                onModerate={(contentId, aprobado) => moderate({ contentId, aprobado })}
                showModeration={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="games">
            <EventGames eventoId={event.id} content={content} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <EventSettings
                event={event}
                onUpdate={updateEvent}
                onDelete={deleteEvent}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
              />
              {/* Zona de Peligro ya está al final de EventSettings */}
            </div>
          </TabsContent>

          <TabsContent value="download">
            <AlbumDownload
              event={event}
              content={content}
            />
          </TabsContent>
        </Tabs>
      </div>

      <QRCodesModal
        event={eventForQR}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </MainLayout>
  );
}
