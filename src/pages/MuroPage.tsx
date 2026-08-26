/**
 * PICKEVENT - Página del Muro Interactivo
 * Vista fullscreen para proyección en eventos
 */

import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  const uploadToken = event?.qr_invitados_token || token || '';
  const fondoUrl = event.muro_fondo_url || null;
  // Si hay fondo personalizado se oculta la barra lateral automáticamente
  const ocultarBanner = !!event.muro_ocultar_banner || !!fondoUrl;
  const mostrarQrFlotante = event.muro_qr_flotante !== false && ocultarBanner;


  return (
    <MuroLayout>
      {/* Fondo personalizado a pantalla completa */}
      {fondoUrl && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${fondoUrl})` }}
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      <div className="relative z-10 flex flex-row h-screen">
        {/* Banner lateral izquierdo */}
        {!ocultarBanner && (
          <MuroBanner
            eventName={event.nombre}
            eventType={event.tipo}
            logoUrl={event.logo_url}
            bannerColor={event.color_banner}
            uploadToken={uploadToken}
            totalPhotos={totalPhotos}
            totalMessages={totalMessages}
          />
        )}


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
            transparentBg={!!fondoUrl}
          />
          
          {/* Mensajes flotantes alrededor de la foto */}
          {!isEventPaused && !activeGame && <MuroMessages messages={contents} />}

          {/* QR flotante (cuando la barra lateral está oculta) */}
          {mostrarQrFlotante && !activeGame && (
            <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center gap-1 rounded-2xl bg-white/95 p-3 shadow-2xl">
              <QRCodeSVG
                value={`${window.location.origin}/subir/${uploadToken}`}
                size={92}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
              <span className="text-[11px] font-semibold text-black/70">¡Subí tu foto!</span>
            </div>
          )}
        </div>
      </div>
    </MuroLayout>
  );
}
