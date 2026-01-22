/**
 * PICKEVENT - Mensajes flotantes del Muro
 * Burbujitas animadas con mensajes de invitados
 * Los mensajes aparecen y desaparecen automáticamente en 5 segundos
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_CONFIG } from '@/lib/constants';
import type { MuroContent } from '@/hooks/useMuroRealtime';

interface MuroMessagesProps {
  messages: MuroContent[];
  maxVisible?: number;
}

interface VisibleMessage extends MuroContent {
  displayId: string; // ID único para animación
  expiresAt: number; // Timestamp de expiración
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

    // Marcar como procesados
    newMessages.forEach(m => processedIdsRef.current.add(m.id));

    // Agregar al estado con timestamp de expiración
    const now = Date.now();
    const messagesToAdd = newMessages.map((m, idx) => ({
      ...m,
      displayId: `${m.id}-${now}-${idx}`,
      expiresAt: now + APP_CONFIG.MESSAGE_BUBBLE_DURATION + (idx * 500), // Escalonar ligeramente
    }));

    setVisibleMessages(prev => {
      // Agregar nuevos al principio, mantener máximo
      const combined = [...messagesToAdd, ...prev];
      return combined.slice(0, maxVisible * 2); // Buffer extra para transiciones
    });
  }, [messages, maxVisible]);

  // Timer para remover mensajes expirados
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setVisibleMessages(prev => {
        const filtered = prev.filter(m => m.expiresAt > now);
        // Si no cambió nada, no re-render
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 500); // Revisar cada 500ms

    return () => clearInterval(interval);
  }, []);

  // Cleanup de IDs procesados (para evitar memory leak en eventos largos)
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Mantener solo los últimos 100 IDs
      if (processedIdsRef.current.size > 100) {
        const arr = Array.from(processedIdsRef.current);
        processedIdsRef.current = new Set(arr.slice(-50));
      }
    }, 60000); // Cada minuto

    return () => clearInterval(cleanup);
  }, []);

  // Solo mostrar los primeros N mensajes visibles
  const displayMessages = visibleMessages.slice(0, maxVisible);

  if (displayMessages.length === 0) return null;

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 max-w-xs z-10 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {displayMessages.map((message, index) => (
          <motion.div
            key={message.displayId}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
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
              x: 100, 
              scale: 0.8,
              transition: { duration: 0.3, ease: 'easeOut' }
            }}
            className="muro-bubble pointer-events-auto"
          >
            <p className="text-sm font-medium line-clamp-3">
              "{message.mensaje_texto}"
            </p>
            {message.invitado_nombre && (
              <p className="text-xs text-white/70 mt-2">
                — {message.invitado_nombre}
              </p>
            )}
            
            {/* Barra de progreso que indica cuánto tiempo queda */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-white/40 rounded-full"
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
