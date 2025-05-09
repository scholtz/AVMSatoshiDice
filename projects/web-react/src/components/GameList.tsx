import React from 'react';
import GameCard from './GameCard';
import GameFilter from './GameFilter';
import { Game, TokenType } from '../types';

interface GameListProps {
  games: Game[];
  tokenFilter: TokenType | null;
  setTokenFilter: (filter: TokenType | null) => void;
  onSelectGame: (gameId: string) => void;
}

const GameList: React.FC<GameListProps> = ({ 
  games, 
  tokenFilter, 
  setTokenFilter, 
  onSelectGame 
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Available Games</h2>
        <span className="text-gray-400">Showing {games.length} games</span>
      </div>
      
      <GameFilter tokenFilter={tokenFilter} setTokenFilter={setTokenFilter} />
      
      {games.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No games found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onClick={onSelectGame} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameList;