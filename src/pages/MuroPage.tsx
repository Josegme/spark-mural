/**
 * PICKEVENT - Página del Muro Interactivo
 * Vista fullscreen para proyección en eventos
 */

import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MuroLayout } from '@/components/layout';
import { MuroBanner, MuroCarousel, MuroMessages } from '@/components/muro';
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
  } = useMuroRealtime(token || '');

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

  // Obtener token de subida del evento (necesitamos cargarlo)
  // Por ahora usamos el mismo token como fallback
  const uploadToken = token || '';

  return (
    <MuroLayout>
      <div className="flex flex-col h-screen">
        {/* Banner superior */}
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
        <div className="flex-1 relative">
          {/* Carrusel solo muestra fotos */}
          <MuroCarousel
            contents={photoContents}
            currentIndex={currentIndex}
            isPremium={event.es_premium}
          />
          
          {/* Mensajes flotantes en el lateral (aparecen y desaparecen en 5 seg) */}
          <MuroMessages messages={contents} />
        </div>
      </div>
    </MuroLayout>
  );
}
