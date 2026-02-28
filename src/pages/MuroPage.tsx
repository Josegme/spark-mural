/**
 * PICKEVENT - Página del Muro Interactivo
 * Vista fullscreen para proyección en eventos
 */

import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MuroLayout } from '@/components/layout';
import { MuroBanner, MuroCarousel, MuroMessages, MuroGameOverlay } from '@/components/muro';
import { useMuroRealtime } from '@/hooks/useMuroRealtime';

export default function MuroPage() {
  const { token } = useParams<{ token: string }>();
  
  const {
    event,
    contents,
    photoContents,
    currentIndex,
    isLoading,
    error,
    totalPhotos,
    totalMessages,
    isEventPaused,
    activeGame,
  } = useMuroRealtime(token || '');

  const isEventNotStarted = event?.estado === 'programado';

  if (isLoading) {
    return (
      <MuroLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muro-foreground/60 text-lg">Cargando evento...</p>
          </div>
        </div>
      </MuroLayout>
    );
  }

  if (error || !event) {
    return (
      <MuroLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-5xl">🔗</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-muro-foreground mb-2">
              Evento no encontrado
            </h1>
            <p className="text-muro-foreground/60">
              El enlace del muro no es válido o el evento ha finalizado.
            </p>
          </div>
        </div>
      </MuroLayout>
    );
  }

  if (isEventNotStarted) {
    return (
      <MuroLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-info/20 flex items-center justify-center">
              <span className="text-5xl">📅</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-muro-foreground mb-2">
              Evento programado
            </h1>
            <p className="text-muro-foreground/60 mb-4">{event.nombre}</p>
            <p className="text-muro-foreground/40 text-sm">
              El muro se activará cuando el anfitrión inicie el evento.
            </p>
          </div>
        </div>
      </MuroLayout>
    );
  }

  // Usar qr_invitados_token para el QR de subida (consistente con el modal)
  const uploadToken = event?.qr_invitados_token || token || '';

  return (
    <MuroLayout>
      <div className="flex flex-row h-screen">
        {/* Banner lateral izquierdo */}
        <MuroBanner
          eventName={event.nombre}
          eventType={event.tipo}
          logoUrl={event.logo_url}
          bannerColor={event.color_banner}
          uploadToken={uploadToken}
          totalPhotos={totalPhotos}
          totalMessages={totalMessages}
        />

        {/* Área principal: Carrusel de FOTOS + Mensajes flotantes */}
        <div className="flex-1 relative overflow-hidden">
          {/* Game overlay - takes over the entire area */}
          {activeGame && activeGame.estado !== 'cerrado' && (
            <MuroGameOverlay
              gameName={activeGame.nombre || 'Juego'}
              gameRule={activeGame.regla || ''}
              allPhotoUrls={photoContents.filter(c => c.url_original).map(c => c.url_original!)}
              selectedPhotoUrls={activeGame.fotos_seleccionadas}
              estado={activeGame.estado}
              activeGameId={activeGame.id}
            />
          )}

          {/* Overlay de pausa */}
          {isEventPaused && !activeGame && (
            <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-4xl">⏸️</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Evento en pausa
                </h2>
                <p className="text-white/60">
                  El muro se reanudará pronto...
                </p>
              </div>
            </div>
          )}

          {/* Carrusel solo muestra fotos */}
          <MuroCarousel
            contents={photoContents}
            currentIndex={currentIndex}
            isPremium={event.es_premium}
          />
          
          {/* Mensajes flotantes alrededor de la foto */}
          {!isEventPaused && !activeGame && <MuroMessages messages={contents} />}
        </div>
      </div>
    </MuroLayout>
  );
}
