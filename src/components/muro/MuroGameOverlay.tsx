/**
 * PICKEVENT - Overlay de Juego en el Muro
 * Ruleta de fotos a pantalla completa con animación y sonido
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playRouletteSound, playRevealSound, stopAllAudio } from '@/lib/gameAudio';

interface MuroGameOverlayProps {
  gameName: string;
  gameRule: string;
  allPhotoUrls: string[];
  selectedPhotoUrls: string[];
  estado: 'girando' | 'revelado' | 'cerrado';
  onRevealComplete?: () => void;
}

const SPIN_DURATION = 6000; // 6 seconds total spin
const TICK_INTERVAL_START = 45; // ms entre cambios al inicio (más rápido)
const TICK_INTERVAL_END = 220; // ms al final (sigue sintiéndose dinámico)

export function MuroGameOverlay({
  gameName,
  gameRule,
  allPhotoUrls,
  selectedPhotoUrls,
  estado,
}: MuroGameOverlayProps) {
  const [phase, setPhase] = useState<'spinning' | 'revealed'>('spinning');
  const [currentSpinPhoto, setCurrentSpinPhoto] = useState(0);
  const [showRule, setShowRule] = useState(false);
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSound = useRef(false);

  const roulettePool = useMemo(() => {
    const uniqueUrls = Array.from(
      new Set([...allPhotoUrls, ...selectedPhotoUrls].filter((url): url is string => !!url))
    );

    // Fallback robusto: si por alguna razón allPhotoUrls llega vacío, usamos seleccionadas
    return uniqueUrls;
  }, [allPhotoUrls, selectedPhotoUrls]);

  // Start spinning animation
  useEffect(() => {
    if (estado === 'revelado') {
      setPhase('revealed');
      setShowRule(true);
      playRevealSound();
      return;
    }

    if (estado !== 'girando') return;

    setPhase('spinning');
    setShowRule(false);
    setCurrentSpinPhoto(Math.floor(Math.random() * Math.max(roulettePool.length, 1)));

    // Play roulette sound once
    if (!hasPlayedSound.current) {
      playRouletteSound(SPIN_DURATION);
      hasPlayedSound.current = true;
    }

    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= SPIN_DURATION) {
        // Spin complete - reveal
        setPhase('revealed');
        playRevealSound();
        setTimeout(() => setShowRule(true), 800);
        return;
      }

      // Slowdown progresivo pero manteniendo ritmo tipo casino
      const progress = elapsed / SPIN_DURATION;
      const interval = TICK_INTERVAL_START + (TICK_INTERVAL_END - TICK_INTERVAL_START) * Math.pow(progress, 1.7);

      if (roulettePool.length > 1) {
        setCurrentSpinPhoto(prev => {
          let next = Math.floor(Math.random() * roulettePool.length);
          if (next === prev) next = (next + 1) % roulettePool.length;
          return next;
        });
      }

      spinRef.current = setTimeout(tick, interval);
    };

    spinRef.current = setTimeout(tick, TICK_INTERVAL_START);

    return () => {
      if (spinRef.current) clearTimeout(spinRef.current);
      stopAllAudio();
    };
  }, [estado, roulettePool]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasPlayedSound.current = false;
      stopAllAudio();
    };
  }, []);

  if (estado === 'cerrado') return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
            }}
            animate={{
              y: [null, Math.random() * -200],
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Game title */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-display font-bold text-white text-center mb-8 drop-shadow-2xl z-10"
      >
        🎮 {gameName}
      </motion.h1>

      {/* Spinning / Revealed photos */}
      {phase === 'spinning' ? (
        <SpinningRoulette
          photoUrl={roulettePool.length > 0 ? roulettePool[currentSpinPhoto % roulettePool.length] : undefined}
        />
      ) : (
        <RevealedPhotos photos={selectedPhotoUrls} />
      )}

      {/* Rule text */}
      <AnimatePresence>
        {showRule && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-8 max-w-4xl mx-auto px-8 z-10"
          >
            <div className="bg-primary/20 backdrop-blur-md border border-primary/40 rounded-2xl px-8 py-6">
              <p className="text-2xl md:text-4xl font-bold text-white text-center leading-relaxed">
                🎉 {gameName} — {gameRule}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpinningRoulette({ photoUrl }: { photoUrl: string }) {
  return (
    <motion.div
      className="relative z-10"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.15, repeat: Infinity }}
    >
      {/* Glow border */}
      <div className="absolute -inset-3 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-60 animate-pulse" />
      <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden border-4 border-white/30">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={photoUrl}
            src={photoUrl}
            alt="Roulette"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.06 }}
            crossOrigin="anonymous"
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RevealedPhotos({ photos }: { photos: string[] }) {
  const gridClass = photos.length === 1 ? 'grid-cols-1' :
    photos.length === 2 ? 'grid-cols-2' :
    photos.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-4 z-10 px-8 max-w-5xl`}>
      {photos.map((url, i) => (
        <motion.div
          key={url}
          initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{
            delay: i * 0.3,
            duration: 0.6,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md opacity-50" />
            <img
              src={url}
              alt={`Ganador ${i + 1}`}
              className="relative w-full aspect-square object-cover rounded-xl border-4 border-white/50 shadow-2xl"
              crossOrigin="anonymous"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
