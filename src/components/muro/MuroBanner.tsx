/**
 * PICKEVENT - Banner Lateral del Muro
 * Panel vertical izquierdo con logo, nombre del evento, stats y QR
 */

import { QrCode, Camera, MessageCircle } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants';

interface MuroBannerProps {
  eventName: string;
  eventType: string;
  logoUrl?: string | null;
  bannerColor: string;
  uploadToken: string;
  totalPhotos: number;
  totalMessages: number;
}

export function MuroBanner({
  eventName,
  eventType,
  logoUrl,
  bannerColor,
  uploadToken,
  totalPhotos,
  totalMessages,
}: MuroBannerProps) {
  const eventTypeConfig = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES];

  return (
    <div
      className="flex flex-col items-center justify-between py-6 px-4 w-[200px] min-w-[200px] shrink-0"
      style={{ backgroundColor: bannerColor }}
    >
      {/* Logo y nombre */}
      <div className="flex flex-col items-center gap-3 text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo del evento"
            className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-3xl">{eventTypeConfig?.icon || '🎉'}</span>
          </div>
        )}
        <div>
          <h1 className="text-lg font-display font-bold text-white drop-shadow-lg leading-tight">
            {eventName}
          </h1>
          <p className="text-white/70 text-xs mt-1">
            {eventTypeConfig?.label || 'Evento'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 justify-center">
          <Camera className="w-4 h-4 text-white/80" />
          <span className="text-white font-bold text-lg">{totalPhotos}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 justify-center">
          <MessageCircle className="w-4 h-4 text-white/80" />
          <span className="text-white font-bold text-lg">{totalMessages}</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/90 font-semibold text-sm text-center">¡Subí tu foto!</p>
        <div className="bg-white p-2 rounded-xl shadow-lg">
          <div className="w-24 h-24 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg flex items-center justify-center">
              <QrCode className="w-14 h-14 text-foreground" />
            </div>
          </div>
        </div>
        <p className="text-white/60 text-xs text-center">Escaneá el QR</p>
      </div>
    </div>
  );
}
