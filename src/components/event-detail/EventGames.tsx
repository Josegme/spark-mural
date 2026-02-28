/**
 * PICKEVENT - Juegos del Evento
 * Configuración y lanzamiento de juegos interactivos
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Save, Trash2, Plus, ChevronDown, ChevronUp, Rocket, X, AlertTriangle, Dices, Square } from 'lucide-react';
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
    updateGameLocal,
    addGame,
    removeGame,
    launchGame,
    spinGame,
    stopGame,
    closeGame,
  } = useEventGames(eventoId);

  const photoUrls = content
    .filter(c => c.tipo === 'foto' && c.aprobado && c.url_original)
    .map(c => c.url_original as string);

  const isGameActive = !!activeGame && activeGame.estado !== 'cerrado';

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
        <CardDescription>
          Configurá los juegos interactivos. Lanzá uno para mostrarlo en el muro y girá la ruleta cuando quieras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active game control panel */}
        {isGameActive && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-medium text-sm">🎮 Juego activo: {activeGame?.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Estado: {activeGame?.estado === 'esperando' ? '⏳ Esperando giro' : activeGame?.estado === 'girando' ? '🎰 Girando...' : '🎉 Revelado'}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={closeGame}>
                <X className="w-4 h-4 mr-1" />
                Cerrar Juego
              </Button>
            </div>

            {/* Spin button — available when esperando or revelado (re-spin) */}
            {(activeGame?.estado === 'esperando' || activeGame?.estado === 'revelado') && (
              <Button
                onClick={() => spinGame(photoUrls)}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all animate-pulse"
                disabled={photoUrls.length < 2}
              >
                <Dices className="w-6 h-6 mr-2" />
                {activeGame?.estado === 'esperando' ? '🎰 ¡Girar Ruleta!' : '🔄 Volver a Girar'}
              </Button>
            )}

            {activeGame?.estado === 'girando' && (
              <Button
                onClick={stopGame}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:shadow-lg transition-all animate-pulse"
              >
                <Square className="w-6 h-6 mr-2" />
                🛑 ¡Detener Ruleta!
              </Button>
            )}
          </div>
        )}

        {photoUrls.length < 2 && games.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              Necesitás al menos 2 fotos aprobadas para lanzar juegos. Actualmente: {photoUrls.length}
            </p>
          </div>
        )}

        {games.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay juegos configurados. Agregá uno para empezar.
          </p>
        )}

        {games.map((game, index) => (
          <GameSlot
            key={game.id || `new-${index}`}
            game={game}
            index={index}
            isSaving={isSaving}
            isGameActive={isGameActive}
            canLaunch={!!game.id && photoUrls.length >= 2 && !isGameActive}
            onUpdate={(updates) => updateGameLocal(index, updates)}
            onSave={() => saveGame(game, index)}
            onRemove={() => removeGame(index)}
            onLaunch={() => launchGame(game, photoUrls)}
          />
        ))}

        <Button
          variant="outline"
          onClick={addGame}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar juego
        </Button>
      </CardContent>
    </Card>
  );
}

interface GameSlotProps {
  game: GameConfig;
  index: number;
  isSaving: boolean;
  isGameActive: boolean;
  canLaunch: boolean;
  onUpdate: (updates: Partial<GameConfig>) => void;
  onSave: () => void;
  onRemove: () => void;
  onLaunch: () => void;
}

function GameSlot({ game, index, isSaving, canLaunch, onUpdate, onSave, onRemove, onLaunch }: GameSlotProps) {
  const [expanded, setExpanded] = useState(true);
  const isSaved = !!game.id;

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
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSave} disabled={isSaving}>
            <Save className="w-3 h-3 mr-1" />
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3 h-3" />
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
            <label className="text-sm font-medium text-muted-foreground">Cantidad de fotos a seleccionar</label>
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

          {isSaved && (
            <Button
              onClick={onLaunch}
              disabled={!canLaunch}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all"
            >
              <Rocket className="w-5 h-5 mr-2" />
              🎮 Lanzar este Juego
            </Button>
          )}
          {!isSaved && (
            <p className="text-xs text-muted-foreground text-center italic">
              Guardá el juego primero para poder lanzarlo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
