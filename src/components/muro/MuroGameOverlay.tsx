/**
 * PICKEVENT - Overlay de Juego en el Muro
 * Fases: esperando (nombre + botón ficticio) → girando (ruleta) → revelado (fotos + regla)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playRouletteSound, playRevealSound, stopAllAudio } from '@/lib/gameAudio';
import { supabase } from '@/integrations/supabase/client';

interface MuroGameOverlayProps {
  gameName: string;
  gameRule: string;
  allPhotoUrls: string[];
  selectedPhotoUrls: string[];
  estado: 'esperando' | 'girando' | 'revelado' | 'cerrado';
  activeGameId?: string;
  onRevealComplete?: () => void;
}

const SPIN_DURATION = 6000;
const TICK_INTERVAL_START = 45;
const TICK_INTERVAL_END = 220;

export function MuroGameOverlay({
  gameName,
  gameRule,
  allPhotoUrls,
  selectedPhotoUrls,
  estado,
  activeGameId,
}: MuroGameOverlayProps) {
  const [phase, setPhase] = useState<'waiting' | 'spinning' | 'revealed'>('waiting');
  const [currentSpinPhoto, setCurrentSpinPhoto] = useState(0);
  const [showRule, setShowRule] = useState(false);
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSound = useRef(false);
  const isSpinning = useRef(false);

  // Use ref for roulette pool to avoid restarting spin effect
  const roulettePoolRef = useRef<string[]>([]);
  useEffect(() => {
    const pool = Array.from(
      new Set([...allPhotoUrls, ...selectedPhotoUrls].filter((url): url is string => !!url))
    );
    roulettePoolRef.current = pool;
  }, [allPhotoUrls, selectedPhotoUrls]);

  // Fake button — purely decorative
  const handleFakeButtonPress = useCallback(() => {}, []);

  // Sync phase with estado — only depend on estado, not on roulettePool
  useEffect(() => {
    if (estado === 'esperando') {
      setPhase('waiting');
      setShowRule(false);
      hasPlayedSound.current = false;
      isSpinning.current = false;
      if (spinRef.current) clearTimeout(spinRef.current);
    } else if (estado === 'revelado') {
      // Direct reveal (e.g. page reload while revealed)
      isSpinning.current = false;
      if (spinRef.current) clearTimeout(spinRef.current);
      setPhase('revealed');
      setShowRule(true);
      playRevealSound();
    } else if (estado === 'girando' && !isSpinning.current) {
      // Only start spin once
      isSpinning.current = true;
      setPhase('spinning');
      setShowRule(false);

      const pool = roulettePoolRef.current;
      setCurrentSpinPhoto(Math.floor(Math.random() * Math.max(pool.length, 1)));

      if (!hasPlayedSound.current) {
        playRouletteSound(SPIN_DURATION);
        hasPlayedSound.current = true;
      }

      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= SPIN_DURATION) {
          isSpinning.current = false;
          setPhase('revealed');
          playRevealSound();
          hasPlayedSound.current = false;
          setTimeout(() => setShowRule(true), 800);
          // Update DB to "revelado"
          if (activeGameId) {
            supabase
              .from('juego_activo')
              .update({ estado: 'revelado', updated_at: new Date().toISOString() })
              .eq('id', activeGameId)
              .then();
          }
          return;
        }

        const progress = elapsed / SPIN_DURATION;
        const interval = TICK_INTERVAL_START + (TICK_INTERVAL_END - TICK_INTERVAL_START) * Math.pow(progress, 1.7);
        const currentPool = roulettePoolRef.current;

        if (currentPool.length > 1) {
          setCurrentSpinPhoto(prev => {
            let next = Math.floor(Math.random() * currentPool.length);
            if (next === prev) next = (next + 1) % currentPool.length;
            return next;
          });
        }

        spinRef.current = setTimeout(tick, interval);
      };

      spinRef.current = setTimeout(tick, TICK_INTERVAL_START);
    }

    return () => {
      if (spinRef.current) clearTimeout(spinRef.current);
    };
  }, [estado, activeGameId]);

  useEffect(() => {
    return () => {
      hasPlayedSound.current = false;
      isSpinning.current = false;
      stopAllAudio();
    };
  }, []);

  if (estado === 'cerrado') return null;

  const pool = roulettePoolRef.current;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background particles */}
      <BackgroundParticles />

      {/* Game title — always visible */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-display font-bold text-white text-center mb-8 drop-shadow-2xl z-10"
      >
        🎮 {gameName}
      </motion.h1>

      {/* Phase: Waiting */}
      {phase === 'waiting' && <WaitingPhase onFakePress={handleFakeButtonPress} />}

      {/* Phase: Spinning */}
      {phase === 'spinning' && (
        <SpinningRoulette
          photoUrl={pool.length > 0 ? pool[currentSpinPhoto % pool.length] : undefined}
        />
      )}

      {/* Phase: Revealed — selected photos + rule */}
      {phase === 'revealed' && (
        <RevealedPhotos photos={selectedPhotoUrls} rule={gameRule} showRule={showRule} />
      )}
    </div>
  );
}

/* ── Background particles ── */
function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
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
  );
}

/* ── Waiting phase ── */
function WaitingPhase({ onFakePress }: { onFakePress: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 flex flex-col items-center gap-6"
    >
      <p className="text-xl md:text-2xl text-white/70 text-center">
        ¿Están listos? 🎲
      </p>
      <motion.button
        onClick={onFakePress}
        className="relative px-16 py-8 rounded-2xl text-3xl md:text-4xl font-bold text-white cursor-pointer border-0 outline-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          boxShadow: '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--primary) / 0.3)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--primary) / 0.3)',
            '0 0 60px hsl(var(--primary) / 0.7), 0 0 120px hsl(var(--primary) / 0.5)',
            '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--primary) / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎰 ¡GIRAR!
      </motion.button>
    </motion.div>
  );
}

/* ── Spinning roulette ── */
function SpinningRoulette({ photoUrl }: { photoUrl?: string }) {
  if (!photoUrl) return null;
  return (
    <motion.div
      className="relative z-10"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.15, repeat: Infinity }}
    >
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

/* ── Revealed photos with rule ── */
function RevealedPhotos({ photos, rule, showRule }: { photos: string[]; rule: string; showRule: boolean }) {
  const count = photos.length;

  return (
    <div className="z-10 flex flex-col items-center justify-center w-full h-full px-4 max-w-[95vw] max-h-[80vh]">
      {/* Photos layout */}
      <div className="relative flex items-center justify-center w-full flex-1 min-h-0">
        {count === 1 && <SinglePhoto url={photos[0]} />}
        {count === 2 && <TwoPhotos photos={photos} />}
        {count === 3 && <ThreePhotos photos={photos} />}
        {count >= 4 && <FourPhotos photos={photos.slice(0, 4)} />}
      </div>

      {/* Rule overlay */}
      <AnimatePresence>
        {showRule && rule && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-4 w-full max-w-4xl mx-auto"
          >
            <div className="bg-primary/20 backdrop-blur-md border border-primary/40 rounded-2xl px-8 py-6">
              <p className="text-2xl md:text-5xl font-bold text-white text-center leading-relaxed">
                🎉 {rule}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Photo with glow wrapper ── */
function PhotoCard({ url, index, className }: { url: string; index: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        delay: index * 0.3,
        duration: 0.6,
        type: 'spring',
        stiffness: 200,
      }}
      className={className}
    >
      <div className="relative w-full h-full">
        <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md opacity-50" />
        <img
          src={url}
          alt={`Ganador ${index + 1}`}
          className="relative w-full h-full object-cover rounded-xl border-4 border-white/50 shadow-2xl"
          crossOrigin="anonymous"
        />
      </div>
    </motion.div>
  );
}

/* 1 photo — big and centered */
function SinglePhoto({ url }: { url: string }) {
  return (
    <div className="w-[70vh] max-w-[90vw] aspect-square">
      <PhotoCard url={url} index={0} className="w-full h-full" />
    </div>
  );
}

/* 2 photos — side by side */
function TwoPhotos({ photos }: { photos: string[] }) {
  return (
    <div className="flex gap-6 items-center justify-center w-full max-h-[65vh]">
      {photos.map((url, i) => (
        <div key={url} className="w-[40vw] max-w-[45vh] aspect-square">
          <PhotoCard url={url} index={i} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}

/* 3 photos — triangle: 1 top center, 2 bottom */
function ThreePhotos({ photos }: { photos: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-[35vw] max-w-[35vh] aspect-square">
        <PhotoCard url={photos[0]} index={0} className="w-full h-full" />
      </div>
      <div className="flex gap-6 items-center justify-center">
        {photos.slice(1).map((url, i) => (
          <div key={url} className="w-[35vw] max-w-[35vh] aspect-square">
            <PhotoCard url={url} index={i + 1} className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* 4 photos — 2x2 grid */
function FourPhotos({ photos }: { photos: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 max-h-[65vh]">
      {photos.map((url, i) => (
        <div key={url} className="w-[35vw] max-w-[32vh] aspect-square">
          <PhotoCard url={url} index={i} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}
