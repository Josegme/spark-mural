/**
 * PICKEVENT - Carrusel del Muro
 * Muestra SOLO FOTOS a pantalla completa con transiciones animadas y likes automáticos
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { MuroContent } from '@/hooks/useMuroRealtime';

interface MuroCarouselProps {
  contents: MuroContent[];
  currentIndex: number;
  isPremium: boolean;
  /** Si hay fondo personalizado, el carrusel no pinta negro */
  transparentBg?: boolean;
}

export function MuroCarousel({ contents, currentIndex, isPremium, transparentBg = false }: MuroCarouselProps) {
  const photos = contents.filter(c => c.tipo === 'foto');
  
  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <EmptyState />
      </div>
    );
  }

  const currentPhoto = photos[currentIndex % photos.length];
  if (!currentPhoto) return null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${transparentBg ? 'bg-transparent' : 'bg-black'}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <FullscreenPhoto content={currentPhoto} isPremium={isPremium} />
        </motion.div>
      </AnimatePresence>

      {/* Indicadores */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {photos.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex % Math.min(photos.length, 10)
                  ? 'bg-primary w-6'
                  : 'bg-white/30'
              }`}
            />
          ))}
          {photos.length > 10 && (
            <span className="text-white/50 text-sm ml-2">
              +{photos.length - 10}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Contador global de likes que nunca decrece entre fotos
const globalLikesRef = { current: 0 };

function FullscreenPhoto({ content, isPremium }: { content: MuroContent; isPremium: boolean }) {
  const imageUrl = isPremium && content.url_ia ? content.url_ia : content.url_original;
  
  // Likes automáticos simulados - siempre incrementales
  const [displayLikes, setDisplayLikes] = useState(() => {
    // Al montar, arrancar desde el máximo entre el global y el likes_count real
    const base = Math.max(globalLikesRef.current, content.likes_count || 0);
    globalLikesRef.current = base;
    return base;
  });
  const [showHeartPop, setShowHeartPop] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Al cambiar de foto, nunca bajar: usar el máximo entre global y el count real
    const base = Math.max(globalLikesRef.current, content.likes_count || 0);
    globalLikesRef.current = base;
    setDisplayLikes(base);

    const scheduleNextLike = () => {
      const delay = 2000 + Math.random() * 4000;
      intervalRef.current = setTimeout(() => {
        const increment = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 2 : 1;
        setDisplayLikes(prev => {
          const next = prev + increment;
          globalLikesRef.current = next;
          return next;
        });
        setShowHeartPop(true);
        setTimeout(() => setShowHeartPop(false), 600);
        scheduleNextLike();
      }, delay);
    };

    scheduleNextLike();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [content.id, content.likes_count]);

  return (
    <div className="absolute inset-0">
      {/* Foto a pantalla completa */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Foto de ${content.invitado_nombre || 'invitado'}`}
          className="w-full h-full object-contain bg-black"
          loading="eager"
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.photo-fallback');
            if (fallback) (fallback as HTMLElement).style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="photo-fallback w-full h-full flex-col items-center justify-center hidden bg-black"
        style={{ display: !imageUrl ? 'flex' : 'none' }}
      >
        <Camera className="w-24 h-24 text-white/20 mb-4" />
        <p className="text-white/40 text-sm">Foto no disponible</p>
      </div>

      {/* Badge IA */}
      {isPremium && content.url_ia && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-premium px-4 py-2 rounded-full z-10">
          <Sparkles className="w-5 h-5 text-black" />
          <span className="text-black font-semibold text-sm">IA</span>
        </div>
      )}

      {isPremium && content.estado_ia === 'procesando' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-500/90 px-4 py-2 rounded-full animate-pulse z-10">
          <Sparkles className="w-5 h-5 text-black animate-spin" />
          <span className="text-black font-semibold text-sm">Procesando IA...</span>
        </div>
      )}

      {/* Overlay inferior con info y likes */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 z-10">
        <div className="flex items-end justify-between">
          <div>
            {content.invitado_nombre && (
              <p className="text-white font-semibold text-xl drop-shadow-lg">
                📸 {content.invitado_nombre}
              </p>
            )}
            {content.mensaje_texto && (
              <p className="text-white/80 mt-1 line-clamp-2 drop-shadow-md">
                "{content.mensaje_texto}"
              </p>
            )}
          </div>
          <div className="relative flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <AnimatePresence>
              {showHeartPop && (
                <motion.div
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -30, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2"
                >
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                </motion.div>
              )}
            </AnimatePresence>
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="text-white font-bold text-lg">
              {displayLikes}
            </span>
          </div>
        </div>
      </div>
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
