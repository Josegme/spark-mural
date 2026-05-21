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
          {/* Tablero de accesos: grid responsivo, tiles con color suave por sección */}
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 h-auto bg-transparent p-0 w-full">
            <TabsTrigger
              value="settings"
              className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-sky-500/10 hover:bg-sky-500/20 data-[state=active]:bg-sky-500/30 data-[state=active]:border-sky-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
            >
              <Settings className="w-6 h-6 text-sky-500" />
              <span className="text-xs font-medium">Config</span>
            </TabsTrigger>

            {FEATURE_FLAGS.INVITACIONES && (
              <TabsTrigger
                value="invitaciones"
                className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-indigo-500/10 hover:bg-indigo-500/20 data-[state=active]:bg-indigo-500/30 data-[state=active]:border-indigo-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
              >
                <Mail className="w-6 h-6 text-indigo-500" />
                <span className="text-xs font-medium">Invitaciones</span>
              </TabsTrigger>
            )}

            <TabsTrigger
              value="content"
              className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-emerald-500/10 hover:bg-emerald-500/20 data-[state=active]:bg-emerald-500/30 data-[state=active]:border-emerald-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
            >
              <LayoutGrid className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-medium">Contenido</span>
            </TabsTrigger>

            <TabsTrigger
              value="moderation"
              className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-amber-500/10 hover:bg-amber-500/20 data-[state=active]:bg-amber-500/30 data-[state=active]:border-amber-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
            >
              <Shield className="w-6 h-6 text-amber-500" />
              <span className="text-xs font-medium">Moderación</span>
            </TabsTrigger>

            <TabsTrigger
              value="games"
              className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-pink-500/10 hover:bg-pink-500/20 data-[state=active]:bg-pink-500/30 data-[state=active]:border-pink-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
            >
              <Gamepad2 className="w-6 h-6 text-pink-500" />
              <span className="text-xs font-medium">Juegos</span>
            </TabsTrigger>

            {FEATURE_FLAGS.CERTIFICADOS && (
              <TabsTrigger
                value="certificados"
                className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-violet-500/10 hover:bg-violet-500/20 data-[state=active]:bg-violet-500/30 data-[state=active]:border-violet-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
              >
                <Award className="w-6 h-6 text-violet-500" />
                <span className="text-xs font-medium">Certificados</span>
              </TabsTrigger>
            )}

            <TabsTrigger
              value="download"
              className="flex-col gap-1.5 h-auto py-4 px-3 rounded-xl border border-border bg-teal-500/10 hover:bg-teal-500/20 data-[state=active]:bg-teal-500/30 data-[state=active]:border-teal-500/60 data-[state=active]:shadow-md transition-all touch-feedback"
            >
              <Download className="w-6 h-6 text-teal-500" />
              <span className="text-xs font-medium">Álbum</span>
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

          {FEATURE_FLAGS.INVITACIONES && (
            <TabsContent value="invitaciones">
              <InvitacionesPanel event={event} />
            </TabsContent>
          )}

          {FEATURE_FLAGS.CERTIFICADOS && (
            <TabsContent value="certificados">
              <CertificadosPanel event={{ id: event.id, nombre: event.nombre, fecha_evento: event.fecha_evento }} />
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
