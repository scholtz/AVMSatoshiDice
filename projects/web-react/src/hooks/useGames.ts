import { useState, useMemo } from 'react';
import { games as mockGames } from '../data/mockData';
import { Game, TokenType } from '../types';

export const useGames = () => {
  const [games, setGames] = useState<Game[]>(mockGames);
  const [tokenFilter, setTokenFilter] = useState<TokenType | null>(null);
  
  // Sort games by win ratio (descending) and then by balance (descending)
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      if (a.winRatio !== b.winRatio) {
        return b.winRatio - a.winRatio;
      }
      return b.balance - a.balance;
    });
  }, [games]);
  
  // Filter games by token type
  const filteredGames = useMemo(() => {
    if (!tokenFilter) return sortedGames;
    return sortedGames.filter(game => game.token.type === tokenFilter);
  }, [sortedGames, tokenFilter]);
  
  // Find a game by ID
  const getGameById = (id: string): Game | undefined => {
    return games.find(game => game.id === id);
  };
  
  // Add a new game
  const addGame = (game: Game) => {
    setGames(prev => [...prev, game]);
  };
  
  // Update a game
  const updateGame = (updatedGame: Game) => {
    setGames(prev => 
      prev.map(game => game.id === updatedGame.id ? updatedGame : game)
    );
  };
  
  return {
    games: filteredGames,
    tokenFilter,
    setTokenFilter,
    getGameById,
    addGame,
    updateGame,
  };
};