/**
 * PICKEVENT - Juegos del Evento
 * Configuración de juegos interactivos en la pestaña Config
 * Sin límite de juegos. El lanzamiento se hace desde el botón flotante.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Save, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventGames, type GameConfig } from '@/hooks/useEventGames';

interface EventGamesProps {
  eventoId: string;
}

export function EventGames({ eventoId }: EventGamesProps) {
  const {
    games,
    isLoading,
    isSaving,
    saveGame,
    updateGameLocal,
    addGame,
    removeGame,
  } = useEventGames(eventoId);

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
          Configurá los juegos interactivos antes del evento. Durante el evento, usá el botón flotante "🎮 Lanzar Juego" que aparece abajo a la derecha para dispararlos en el muro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            onUpdate={(updates) => updateGameLocal(index, updates)}
            onSave={() => saveGame(game, index)}
            onRemove={() => removeGame(index)}
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
  onUpdate: (updates: Partial<GameConfig>) => void;
  onSave: () => void;
  onRemove: () => void;
}

function GameSlot({ game, index, isSaving, onUpdate, onSave, onRemove }: GameSlotProps) {
  const [expanded, setExpanded] = useState(true);

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
        </div>
      )}
    </div>
  );
}
