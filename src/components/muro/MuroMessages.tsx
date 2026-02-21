/**
 * PICKEVENT - Mensajes flotantes del Muro
 * Burbujas grandes animadas con mensajes de invitados
 * Aparecen y desaparecen automáticamente en 5 segundos
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from '@/lib/constants';
import type { MuroContent } from '@/hooks/useMuroRealtime';

interface MuroMessagesProps {
  messages: MuroContent[];
  maxVisible?: number;
}

// Zonas: bordes de la foto (nunca centro, nunca sobre el banner izquierdo)
const POSITION_ZONES = [
  // Arriba izquierda
  { top: '5%', left: '2%', right: 'auto', bottom: 'auto' },
  { top: '8%', left: '10%', right: 'auto', bottom: 'auto' },
  // Arriba derecha
  { top: '5%', right: '3%', left: 'auto', bottom: 'auto' },
  { top: '10%', right: '10%', left: 'auto', bottom: 'auto' },
  // Medio izquierda
  { top: '40%', left: '2%', right: 'auto', bottom: 'auto' },
  { top: '55%', left: '3%', right: 'auto', bottom: 'auto' },
  // Medio derecha
  { top: '40%', right: '3%', left: 'auto', bottom: 'auto' },
  { top: '55%', right: '4%', left: 'auto', bottom: 'auto' },
  // Abajo izquierda
  { bottom: '12%', left: '2%', right: 'auto', top: 'auto' },
  { bottom: '18%', left: '8%', right: 'auto', top: 'auto' },
  // Abajo derecha
  { bottom: '12%', right: '3%', left: 'auto', top: 'auto' },
  { bottom: '18%', right: '10%', left: 'auto', top: 'auto' },
];

interface VisibleMessage extends MuroContent {
  displayId: string;
  expiresAt: number;
  position: typeof POSITION_ZONES[number];
}

export function MuroMessages({ 
  messages, 
  maxVisible = APP_CONFIG.MESSAGE_MAX_VISIBLE 
}: MuroMessagesProps) {
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessage[]>([]);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Agregar nuevos mensajes cuando llegan
  useEffect(() => {
    const newMessages = messages
      .filter(m => m.tipo === 'mensaje')
      .filter(m => !processedIdsRef.current.has(m.id));

    if (newMessages.length === 0) return;

    newMessages.forEach(m => processedIdsRef.current.add(m.id));

    const now = Date.now();
    const usedZones = new Set<number>();
    const messagesToAdd = newMessages.map((m, idx) => {
      let zoneIdx: number;
      do {
        zoneIdx = Math.floor(Math.random() * POSITION_ZONES.length);
      } while (usedZones.has(zoneIdx) && usedZones.size < POSITION_ZONES.length);
      usedZones.add(zoneIdx);
      return {
        ...m,
        displayId: `${m.id}-${now}-${idx}`,
        expiresAt: now + APP_CONFIG.MESSAGE_BUBBLE_DURATION + (idx * 500),
        position: POSITION_ZONES[zoneIdx],
      };
    });

    setVisibleMessages(prev => {
      const combined = [...messagesToAdd, ...prev];
      return combined.slice(0, maxVisible * 2);
    });
  }, [messages, maxVisible]);

  // Timer para remover mensajes expirados
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setVisibleMessages(prev => {
        const filtered = prev.filter(m => m.expiresAt > now);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Cleanup de IDs procesados
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (processedIdsRef.current.size > 100) {
        const arr = Array.from(processedIdsRef.current);
        processedIdsRef.current = new Set(arr.slice(-50));
      }
    }, 60000);

    return () => clearInterval(cleanup);
  }, []);

  const displayMessages = visibleMessages.slice(0, maxVisible);

  if (displayMessages.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {displayMessages.map((message) => (
          <motion.div
            key={message.displayId}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.7,
              transition: { duration: 0.3, ease: 'easeOut' }
            }}
            className="absolute max-w-sm rounded-2xl px-6 py-5 shadow-2xl pointer-events-auto"
            style={{ 
              background: 'hsl(330 85% 55% / 0.92)',
              ...message.position,
            }}
          >
            <p className="text-xl font-bold text-white leading-snug line-clamp-3">
              "{message.mensaje_texto}"
            </p>
            {message.invitado_nombre && (
              <p className="text-sm text-white/70 mt-3 font-medium">
                — {message.invitado_nombre}
              </p>
            )}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ 
                duration: APP_CONFIG.MESSAGE_BUBBLE_DURATION / 1000,
                ease: 'linear'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
