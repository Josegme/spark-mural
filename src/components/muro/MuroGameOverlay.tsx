/**
 * PICKEVENT - Overlay de Juego en el Muro
 * Fases: esperando (nombre + botón ficticio) → girando (ruleta) → revelado (fotos + regla)
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

  const roulettePool = useMemo(() => {
    return Array.from(
      new Set([...allPhotoUrls, ...selectedPhotoUrls].filter((url): url is string => !!url))
    );
  }, [allPhotoUrls, selectedPhotoUrls]);

  // Fake button on muro triggers spin via Supabase
  const handleFakeButtonPress = useCallback(async () => {
    if (!activeGameId) return;
    // This triggers the spin from the wall — same as pressing from the panel
    // The panel's spinGame does the photo selection, but from the wall we just
    // signal readiness. We update estado to trigger the panel to spin.
    // Actually, the wall button should also work independently — select random photos and spin.
    const photoUrls = allPhotoUrls.filter(u => !!u);
    if (photoUrls.length < 2) return;

    const shuffled = [...photoUrls].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4); // Max 4, will be limited by game config

    await supabase
      .from('juego_activo')
      .update({
        estado: 'girando',
        fotos_seleccionadas: selected,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeGameId);
  }, [activeGameId, allPhotoUrls]);

  // Sync phase with estado
  useEffect(() => {
    if (estado === 'esperando') {
      setPhase('waiting');
      setShowRule(false);
      hasPlayedSound.current = false;
      if (spinRef.current) clearTimeout(spinRef.current);
    } else if (estado === 'revelado') {
      setPhase('revealed');
      setShowRule(true);
      playRevealSound();
    } else if (estado === 'girando') {
      setPhase('spinning');
      setShowRule(false);
      setCurrentSpinPhoto(Math.floor(Math.random() * Math.max(roulettePool.length, 1)));

      if (!hasPlayedSound.current) {
        playRouletteSound(SPIN_DURATION);
        hasPlayedSound.current = true;
      }

      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= SPIN_DURATION) {
          setPhase('revealed');
          playRevealSound();
          hasPlayedSound.current = false;
          setTimeout(() => setShowRule(true), 800);
          return;
        }

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
    }

    return () => {
      if (spinRef.current) clearTimeout(spinRef.current);
    };
  }, [estado, roulettePool]);

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

      {/* Game title — always visible */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-display font-bold text-white text-center mb-8 drop-shadow-2xl z-10"
      >
        🎮 {gameName}
      </motion.h1>

      {/* Phase: Waiting — show fake button */}
      {phase === 'waiting' && (
        <WaitingPhase onFakePress={handleFakeButtonPress} />
      )}

      {/* Phase: Spinning — roulette */}
      {phase === 'spinning' && (
        <SpinningRoulette
          photoUrl={roulettePool.length > 0 ? roulettePool[currentSpinPhoto % roulettePool.length] : undefined}
        />
      )}

      {/* Phase: Revealed — selected photos */}
      {phase === 'revealed' && (
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
                🎉 {gameRule}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
