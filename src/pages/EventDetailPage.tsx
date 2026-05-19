/**
 * PICKEVENT - Detalle del Evento
 * Página completa de gestión de un evento específico
 */

import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, Shield, Settings, Download, Gamepad2, Mail, Award } from 'lucide-react';
import { EventHeaderSkeleton, EventsGridSkeleton } from '@/components/ui/skeletons';
import { useEventDetails } from '@/hooks/useEventDetails';
import { QRCodesModal } from '@/components/dashboard/QRCodesModal';
import {
  EventHeader,
  ContentGrid,
  EventSettings,
  AlbumDownload,
} from '@/components/event-detail';
import { EventGames } from '@/components/event-detail/EventGames';
import { InvitacionesPanel } from '@/components/invitaciones/InvitacionesPanel';
import { CertificadosPanel } from '@/components/certificados/CertificadosPanel';
import { FEATURE_FLAGS } from '@/lib/constants';
import type { UserEvent } from '@/hooks/useUserEvents';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { event, content, isLoading, error, moderate, updateEvent, changeStatus, deleteEvent, isUpdating, isDeleting } = useEventDetails(id);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-6 space-y-6">
          <EventHeaderSkeleton />
          <EventsGridSkeleton count={6} />
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
      <div className="container py-6 overflow-x-hidden">
        <EventHeader
          event={event}
          onChangeStatus={changeStatus}
          onOpenQR={() => setQrModalOpen(true)}
          isUpdating={isUpdating}
          pagoPendiente={event.pago_estado === 'pendiente'}
        />

        <Tabs defaultValue="content" className="space-y-6">
          {/* Scrollable horizontal con labels siempre visibles */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <TabsList className={`inline-flex w-auto sm:w-full sm:max-w-${FEATURE_FLAGS.INVITACIONES ? '2xl' : 'lg'} sm:grid sm:grid-cols-${FEATURE_FLAGS.INVITACIONES ? '6' : '5'} h-auto p-1`}>
              <TabsTrigger value="content" className="gap-2 px-3 py-2 touch-feedback">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Contenido</span>
              </TabsTrigger>
              <TabsTrigger value="moderation" className="gap-2 px-3 py-2 touch-feedback">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Moderación</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="gap-2 px-3 py-2 touch-feedback">
                <Gamepad2 className="w-4 h-4 shrink-0" />
                <span>Juegos</span>
              </TabsTrigger>
              {FEATURE_FLAGS.INVITACIONES && (
                <TabsTrigger value="invitaciones" className="gap-2 px-3 py-2 touch-feedback">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Invitaciones</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" className="gap-2 px-3 py-2 touch-feedback">
                <Settings className="w-4 h-4 shrink-0" />
                <span>Config</span>
              </TabsTrigger>
              <TabsTrigger value="download" className="gap-2 px-3 py-2 touch-feedback">
                <Download className="w-4 h-4 shrink-0" />
                <span>Álbum</span>
              </TabsTrigger>
            </TabsList>
          </div>

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

          {FEATURE_FLAGS.INVITACIONES && (
            <TabsContent value="invitaciones">
              <InvitacionesPanel event={event} />
            </TabsContent>
          )}

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
