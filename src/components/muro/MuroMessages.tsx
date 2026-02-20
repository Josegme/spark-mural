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

interface VisibleMessage extends MuroContent {
  displayId: string;
  expiresAt: number;
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
    const messagesToAdd = newMessages.map((m, idx) => ({
      ...m,
      displayId: `${m.id}-${now}-${idx}`,
      expiresAt: now + APP_CONFIG.MESSAGE_BUBBLE_DURATION + (idx * 500),
    }));

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
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-5 max-w-sm z-10 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {displayMessages.map((message, index) => (
          <motion.div
            key={message.displayId}
            layout
            initial={{ opacity: 0, x: 120, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: { 
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.05 
              }
            }}
            exit={{ 
              opacity: 0, 
              x: 120, 
              scale: 0.8,
              transition: { duration: 0.3, ease: 'easeOut' }
            }}
            className="relative rounded-2xl px-6 py-5 shadow-2xl pointer-events-auto"
            style={{ background: 'hsl(330 85% 55% / 0.92)' }}
          >
            <p className="text-xl font-bold text-white leading-snug line-clamp-3">
              "{message.mensaje_texto}"
            </p>
            {message.invitado_nombre && (
              <p className="text-sm text-white/70 mt-3 font-medium">
                — {message.invitado_nombre}
              </p>
            )}
            
            {/* Barra de progreso */}
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
