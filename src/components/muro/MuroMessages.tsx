/**
 * PICKEVENT - Mensajes flotantes del Muro
 * Burbujitas animadas con mensajes de invitados
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import type { MuroContent } from '@/hooks/useMuroRealtime';

interface MuroMessagesProps {
  messages: MuroContent[];
  maxVisible?: number;
}

export function MuroMessages({ messages, maxVisible = 3 }: MuroMessagesProps) {
  // Solo mostrar los mensajes más recientes
  const visibleMessages = useMemo(() => {
    return messages
      .filter((m) => m.tipo === 'mensaje')
      .slice(0, maxVisible);
  }, [messages, maxVisible]);

  if (visibleMessages.length === 0) return null;

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 max-w-xs z-10">
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: { delay: index * 0.1 }
            }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="muro-bubble"
          >
            <p className="text-sm font-medium line-clamp-3">
              "{message.mensaje_texto}"
            </p>
            {message.invitado_nombre && (
              <p className="text-xs text-white/70 mt-2">
                — {message.invitado_nombre}
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
