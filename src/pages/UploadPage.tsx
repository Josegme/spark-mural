/**
 * PICKEVENT - Página de subida para invitados
 * Accesible via QR sin autenticación
 */

import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2, PartyPopper, AlertCircle } from 'lucide-react';
import { UploadTabs } from '@/components/upload';
import { useUploadContent } from '@/hooks/useUploadContent';
import { EVENT_TYPES } from '@/lib/constants';

export default function UploadPage() {
  const { token } = useParams<{ token: string }>();
  
  const {
    event,
    isLoading,
    error,
    uploadsRemaining,
    uploadPhoto,
    uploadVideo,
    sendMessage,
    isUploading,
  } = useUploadContent(token || '');

  // Forzar fetch inicial
  useEffect(() => {
    // El hook ya hace el fetch en su inicialización
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            {error || 'Evento no encontrado'}
          </h1>
          <p className="text-muted-foreground">
            Verificá el enlace o escaneá el código QR nuevamente.
          </p>
        </div>
      </div>
    );
  }

  const eventType = EVENT_TYPES[event.tipo as keyof typeof EVENT_TYPES];

  return (
    <div className="min-h-screen bg-background">
      {/* Header con info del evento */}
      <header
        className="px-4 py-6 text-center"
        style={{ backgroundColor: event.color_banner }}
      >
        <div className="max-w-md mx-auto">
          {event.logo_url ? (
            <img
              src={event.logo_url}
              alt="Logo"
              className="w-20 h-20 mx-auto rounded-2xl object-cover border-2 border-white/20 mb-4"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <span className="text-4xl">{eventType?.icon || '🎉'}</span>
            </div>
          )}
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            {event.nombre}
          </h1>
          <p className="text-white/80 text-sm">
            {eventType?.label || 'Evento'}
          </p>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Mensaje de bienvenida */}
        <div className="text-center mb-8">
          <PartyPopper className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-2">
            ¡Compartí tus fotos!
          </h2>
          <p className="text-muted-foreground text-sm">
            Subí fotos, videos o dejá un mensaje para los anfitriones
          </p>
        </div>

        {/* Info de límite si aplica */}
        {uploadsRemaining !== null && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm">
              <span className="font-semibold text-primary">{uploadsRemaining}</span>
              {' '}subidas restantes
            </p>
          </div>
        )}

        {/* Premium badge */}
        {event.es_premium && (
          <div className="bg-gradient-premium text-black rounded-xl p-4 mb-6 text-center">
            <p className="font-semibold flex items-center justify-center gap-2">
              ✨ Evento Premium con IA
            </p>
            <p className="text-sm mt-1 opacity-80">
              Tus fotos se transformarán con efectos especiales
            </p>
          </div>
        )}

        {/* Tabs de subida */}
        <UploadTabs
          onUploadPhoto={uploadPhoto}
          onUploadVideo={uploadVideo}
          onSendMessage={sendMessage}
          isUploading={isUploading}
          isPremium={event.es_premium}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>
          Powered by{' '}
          <span className="font-semibold text-gradient-primary">PickEvent</span>
        </p>
      </footer>
    </div>
  );
}
