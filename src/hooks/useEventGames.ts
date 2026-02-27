/**
 * PICKEVENT - Hook para gestionar Juegos del Evento
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GameConfig {
  id?: string;
  evento_id: string;
  nombre: string;
  cantidad_fotos: number;
  regla: string;
  orden: number;
}

export interface ActiveGame {
  id: string;
  evento_id: string;
  juego_id: string;
  estado: 'girando' | 'revelado' | 'cerrado';
  fotos_seleccionadas: string[];
  nombre?: string;
  regla?: string;
  cantidad_fotos?: number;
}

const DEFAULT_GAMES: Omit<GameConfig, 'evento_id'>[] = [];

export function useEventGames(eventoId: string | undefined) {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch games
  const fetchGames = useCallback(async () => {
    if (!eventoId) return;

    const { data, error } = await supabase
      .from('juegos_evento')
      .select('*')
      .eq('evento_id', eventoId)
      .order('orden');

    if (error) {
      console.error('Error fetching games:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setGames(data.map(g => ({
        id: g.id,
        evento_id: g.evento_id,
        nombre: g.nombre,
        cantidad_fotos: g.cantidad_fotos,
        regla: g.regla,
        orden: g.orden,
      })));
    } else {
      // Use defaults
      setGames(DEFAULT_GAMES.map(g => ({ ...g, evento_id: eventoId })));
    }
    setIsLoading(false);
  }, [eventoId]);

  // Fetch active game
  const fetchActiveGame = useCallback(async () => {
    if (!eventoId) return;

    const { data } = await supabase
      .from('juego_activo')
      .select('*')
      .eq('evento_id', eventoId)
      .neq('estado', 'cerrado')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ag = data[0];
      // Get game info
      const game = games.find(g => g.id === ag.juego_id);
      setActiveGame({
        id: ag.id,
        evento_id: ag.evento_id,
        juego_id: ag.juego_id,
        estado: ag.estado as ActiveGame['estado'],
        fotos_seleccionadas: (ag.fotos_seleccionadas as string[]) || [],
        nombre: game?.nombre,
        regla: game?.regla,
        cantidad_fotos: game?.cantidad_fotos,
      });
    } else {
      setActiveGame(null);
    }
  }, [eventoId, games]);

  useEffect(() => { fetchGames(); }, [fetchGames]);
  useEffect(() => { if (games.length > 0) fetchActiveGame(); }, [games, fetchActiveGame]);

  // Save a game config
  const saveGame = useCallback(async (game: GameConfig, index: number) => {
    if (!eventoId) return;
    setIsSaving(true);

    try {
      if (game.id) {
        const { error } = await supabase
          .from('juegos_evento')
          .update({ nombre: game.nombre, cantidad_fotos: game.cantidad_fotos, regla: game.regla })
          .eq('id', game.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('juegos_evento')
          .insert({ evento_id: eventoId, nombre: game.nombre, cantidad_fotos: game.cantidad_fotos, regla: game.regla, orden: index })
          .select()
          .single();
        if (error) throw error;
        setGames(prev => prev.map((g, i) => i === index ? { ...g, id: data.id } : g));
      }
      toast({ title: 'Juego guardado', description: `"${game.nombre}" configurado correctamente` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el juego', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [eventoId, toast]);

  // Launch a game
  const launchGame = useCallback(async (game: GameConfig, photoUrls: string[]) => {
    if (!eventoId || !game.id) {
      // Need to save first
      toast({ title: 'Guardá el juego primero', description: 'Hacé clic en "Guardar" antes de lanzar', variant: 'destructive' });
      return;
    }

    if (photoUrls.length < 2) {
      toast({ title: 'Fotos insuficientes', description: 'Necesitás al menos 2 fotos de invitados para poder lanzar un juego', variant: 'destructive' });
      return;
    }

    // Select random photos
    const shuffled = [...photoUrls].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, game.cantidad_fotos);

    try {
      // Close any existing active game first
      await supabase
        .from('juego_activo')
        .update({ estado: 'cerrado' })
        .eq('evento_id', eventoId)
        .neq('estado', 'cerrado');

      const { data, error } = await supabase
        .from('juego_activo')
        .insert({
          evento_id: eventoId,
          juego_id: game.id,
          estado: 'girando',
          fotos_seleccionadas: selected,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveGame({
        id: data.id,
        evento_id: data.evento_id,
        juego_id: data.juego_id,
        estado: 'girando',
        fotos_seleccionadas: selected,
        nombre: game.nombre,
        regla: game.regla,
        cantidad_fotos: game.cantidad_fotos,
      });

      toast({ title: '🎮 ¡Juego lanzado!', description: `"${game.nombre}" está en la pantalla` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo lanzar el juego', variant: 'destructive' });
    }
  }, [eventoId, toast]);

  // Close game
  const closeGame = useCallback(async () => {
    if (!activeGame) return;

    try {
      const { error } = await supabase
        .from('juego_activo')
        .update({ estado: 'cerrado', updated_at: new Date().toISOString() })
        .eq('id', activeGame.id);

      if (error) throw error;
      setActiveGame(null);
      toast({ title: 'Juego cerrado', description: 'El muro volvió a la vista normal' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo cerrar el juego', variant: 'destructive' });
    }
  }, [activeGame, toast]);

  // Update local game state
  const updateGameLocal = useCallback((index: number, updates: Partial<GameConfig>) => {
    setGames(prev => prev.map((g, i) => i === index ? { ...g, ...updates } : g));
  }, []);

  // Add a new empty game locally
  const addGame = useCallback(() => {
    if (!eventoId) return;
    setGames(prev => [...prev, {
      evento_id: eventoId,
      nombre: '',
      cantidad_fotos: 2,
      regla: '',
      orden: prev.length,
    }]);
  }, [eventoId]);

  // Remove a game (local + DB)
  const removeGame = useCallback(async (index: number) => {
    const game = games[index];
    if (game?.id) {
      await supabase.from('juegos_evento').delete().eq('id', game.id);
    }
    setGames(prev => prev.filter((_, i) => i !== index));
  }, [games]);

  return {
    games,
    activeGame,
    isLoading,
    isSaving,
    saveGame,
    launchGame,
    closeGame,
    updateGameLocal,
    addGame,
    removeGame,
    fetchActiveGame,
  };
}
