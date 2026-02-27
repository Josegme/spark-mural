/**
 * PICKEVENT - Juegos del Evento
 * Configuración y lanzamiento de juegos interactivos desde la pestaña Moderación
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Save, Rocket, X, AlertTriangle } from 'lucide-react';
import { useEventGames, type GameConfig } from '@/hooks/useEventGames';
import type { EventContent } from '@/hooks/useEventDetails';

interface EventGamesProps {
  eventoId: string;
  content: EventContent[];
}

export function EventGames({ eventoId, content }: EventGamesProps) {
  const {
    games,
    activeGame,
    isLoading,
    isSaving,
    saveGame,
    launchGame,
    closeGame,
    updateGameLocal,
  } = useEventGames(eventoId);

  // Get all approved photo URLs for the roulette
  const photoUrls = content
    .filter(c => c.tipo === 'foto' && c.aprobado && c.url_original)
    .map(c => c.url_original as string);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Cargando juegos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-primary" />
          Juegos del Evento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configurá hasta 3 juegos interactivos. Al lanzar uno, aparecerá en el muro a pantalla completa con una ruleta de fotos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active game banner */}
        {activeGame && activeGame.estado !== 'cerrado' && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-primary">🎮 Juego en curso: {activeGame.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Estado: {activeGame.estado === 'girando' ? 'Ruleta girando...' : 'Fotos reveladas'}
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={closeGame}>
              <X className="w-4 h-4 mr-1" />
              Cerrar juego
            </Button>
          </div>
        )}

        {/* Photo count warning */}
        {photoUrls.length < 2 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <p className="text-sm text-warning">
              Necesitás al menos 2 fotos de invitados para poder lanzar un juego. Actualmente: {photoUrls.length}
            </p>
          </div>
        )}

        {/* Game slots */}
        {games.map((game, index) => (
          <GameSlot
            key={index}
            game={game}
            index={index}
            isSaving={isSaving}
            isGameActive={!!activeGame && activeGame.estado !== 'cerrado'}
            photoCount={photoUrls.length}
            onUpdate={(updates) => updateGameLocal(index, updates)}
            onSave={() => saveGame(game, index)}
            onLaunch={() => launchGame(game, photoUrls)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface GameSlotProps {
  game: GameConfig;
  index: number;
  isSaving: boolean;
  isGameActive: boolean;
  photoCount: number;
  onUpdate: (updates: Partial<GameConfig>) => void;
  onSave: () => void;
  onLaunch: () => void;
}

function GameSlot({ game, index, isSaving, isGameActive, photoCount, onUpdate, onSave, onLaunch }: GameSlotProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <span className="text-lg">🎲</span>
          <span className="font-medium">{game.nombre || `Juego ${index + 1}`}</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({game.cantidad_fotos} foto{game.cantidad_fotos > 1 ? 's' : ''})
          </span>
        </button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-3 h-3 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nombre del juego</label>
            <Input
              value={game.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              placeholder="Ej: Trensito Locardo"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Cantidad de fotos</label>
            <Select
              value={String(game.cantidad_fotos)}
              onValueChange={(v) => onUpdate({ cantidad_fotos: Number(v) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 foto</SelectItem>
                <SelectItem value="2">2 fotos</SelectItem>
                <SelectItem value="3">3 fotos</SelectItem>
                <SelectItem value="4">4 fotos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Regla / Prenda</label>
            <Input
              value={game.regla}
              onChange={(e) => onUpdate({ regla: e.target.value })}
              placeholder="Ej: Todos tienen que hacer un trensito con los ojos vendados"
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Launch button - always visible, prominent */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={onLaunch}
          disabled={isGameActive || photoCount < 2 || !game.id}
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 px-6"
          size="lg"
        >
          <Rocket className="w-5 h-5 mr-2" />
          ¡Lanzar Juego!
        </Button>
      </div>
    </div>
  );
}
