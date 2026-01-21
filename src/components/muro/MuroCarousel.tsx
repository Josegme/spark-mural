/**
 * PICKEVENT - Carrusel del Muro
 * Muestra fotos/videos/mensajes con transiciones
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Camera, Sparkles } from 'lucide-react';
import type { MuroContent } from '@/hooks/useMuroRealtime';

interface MuroCarouselProps {
  contents: MuroContent[];
  currentIndex: number;
  isPremium: boolean;
}

export function MuroCarousel({ contents, currentIndex, isPremium }: MuroCarouselProps) {
  if (contents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState />
      </div>
    );
  }

  const currentContent = contents[currentIndex];
  if (!currentContent) return null;

  return (
    <div className="flex-1 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center p-8"
        >
          {currentContent.tipo === 'mensaje' ? (
            <MessageCard content={currentContent} />
          ) : (
            <PhotoCard content={currentContent} isPremium={isPremium} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de navegación */}
      {contents.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {contents.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex % 10
                  ? 'bg-primary w-6'
                  : 'bg-white/30'
              }`}
            />
          ))}
          {contents.length > 10 && (
            <span className="text-white/50 text-sm ml-2">
              +{contents.length - 10}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoCard({ content, isPremium }: { content: MuroContent; isPremium: boolean }) {
  // Si es premium y tiene URL IA procesada, mostrar esa
  const imageUrl = isPremium && content.url_ia ? content.url_ia : content.url_original;

  return (
    <div className="relative max-w-4xl w-full">
      {/* Imagen principal */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Foto del evento"
            className="w-full h-auto max-h-[70vh] object-contain bg-black/50"
          />
        ) : (
          <div className="w-full h-96 bg-muro-card flex items-center justify-center">
            <Camera className="w-24 h-24 text-white/20" />
          </div>
        )}

        {/* Badge IA si está procesada */}
        {isPremium && content.url_ia && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-premium px-4 py-2 rounded-full">
            <Sparkles className="w-5 h-5 text-black" />
            <span className="text-black font-semibold text-sm">IA</span>
          </div>
        )}

        {/* Overlay con info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              {content.invitado_nombre && (
                <p className="text-white font-semibold text-xl">
                  📸 {content.invitado_nombre}
                </p>
              )}
              {content.mensaje_texto && (
                <p className="text-white/80 mt-1 line-clamp-2">
                  "{content.mensaje_texto}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Heart className="w-6 h-6 text-primary fill-primary" />
              <span className="text-white font-bold text-lg">
                {content.likes_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCard({ content }: { content: MuroContent }) {
  return (
    <div className="max-w-2xl w-full">
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="muro-bubble text-center p-8"
      >
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-white/80" />
        <p className="text-2xl md:text-3xl font-display font-bold text-white leading-relaxed">
          "{content.mensaje_texto}"
        </p>
        {content.invitado_nombre && (
          <p className="mt-6 text-white/70 text-lg">
            — {content.invitado_nombre}
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="text-white/80">{content.likes_count}</span>
        </div>
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-12"
    >
      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
        <Camera className="w-16 h-16 text-white/30" />
      </div>
      <h2 className="text-3xl font-display font-bold text-white mb-4">
        ¡Esperando fotos!
      </h2>
      <p className="text-white/60 text-lg max-w-md mx-auto">
        Escaneá el código QR para subir la primera foto del evento
      </p>
    </motion.div>
  );
}
