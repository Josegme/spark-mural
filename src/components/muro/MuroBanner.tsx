/**
 * PICKEVENT - Banner del Muro
 * Header con logo, nombre del evento y QR para subir
 */

import { QrCode, Camera, Heart, MessageCircle } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
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
  const uploadUrl = getUploadUrl(uploadToken);

  return (
    <div
      className="relative flex items-center justify-between px-8 py-4"
      style={{ backgroundColor: bannerColor }}
    >
      {/* Logo y nombre del evento */}
      <div className="flex items-center gap-4">
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
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white drop-shadow-lg">
            {eventName}
          </h1>
          <p className="text-white/80 text-sm flex items-center gap-2">
            <span>{eventTypeConfig?.label || 'Evento'}</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">
              <Camera className="w-4 h-4" /> {totalPhotos}
            </span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" /> {totalMessages}
            </span>
          </p>
        </div>
      </div>

      {/* QR Code para subir */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-white font-semibold">¡Subí tu foto!</p>
          <p className="text-white/70 text-sm">Escaneá el QR</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-lg">
          <div className="w-20 h-20 flex items-center justify-center">
            {/* Simple QR placeholder - en producción usar librería de QR */}
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
