/**
 * PICKEVENT - Botón flotante para lanzar juegos
 * Se muestra abajo a la derecha, grande y llamativo.
 * El anfitrión lo presiona para lanzar la ruleta en el muro.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gamepad2, Rocket, X, AlertTriangle } from 'lucide-react';
import { useEventGames, type GameConfig } from '@/hooks/useEventGames';
import type { EventContent } from '@/hooks/useEventDetails';

interface GameLauncherFABProps {
  eventoId: string;
  content: EventContent[];
}

export function GameLauncherFAB({ eventoId, content }: GameLauncherFABProps) {
  const {
    games,
    activeGame,
    launchGame,
    closeGame,
  } = useEventGames(eventoId);

  const [menuOpen, setMenuOpen] = useState(false);

  const photoUrls = content
    .filter(c => c.tipo === 'foto' && c.aprobado && c.url_original)
    .map(c => c.url_original as string);

  const savedGames = games.filter(g => g.id);
  const isGameActive = !!activeGame && activeGame.estado !== 'cerrado';

  if (savedGames.length === 0) return null;

  return (
    <>
      {/* Overlay backdrop when menu is open */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Game selection menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-6 z-50 bg-card border rounded-xl shadow-2xl p-4 w-80 max-h-96 overflow-y-auto"
          >
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Elegí un juego
            </h3>

            {photoUrls.length < 2 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">
                  Necesitás al menos 2 fotos aprobadas. Actualmente: {photoUrls.length}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {savedGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    launchGame(game, photoUrls);
                    setMenuOpen(false);
                  }}
                  disabled={isGameActive || photoUrls.length < 2}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium">🎲 {game.nombre}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {game.cantidad_fotos} foto{game.cantidad_fotos > 1 ? 's' : ''} · {game.regla}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {isGameActive ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Button
              onClick={closeGame}
              variant="destructive"
              size="lg"
              className="h-16 px-8 rounded-full shadow-2xl text-lg font-bold"
            >
              <X className="w-6 h-6 mr-2" />
              Cerrar Juego
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              size="lg"
              className="h-16 px-8 rounded-full shadow-2xl text-lg font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-primary/40 hover:shadow-xl transition-all"
            >
              <Rocket className="w-6 h-6 mr-2" />
              🎮 Lanzar Juego
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
