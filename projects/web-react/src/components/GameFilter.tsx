import React from 'react';
import { TokenType } from '../types';
import { tokens } from '../data/mockData';

interface GameFilterProps {
  tokenFilter: TokenType | null;
  setTokenFilter: (filter: TokenType | null) => void;
}

const GameFilter: React.FC<GameFilterProps> = ({ tokenFilter, setTokenFilter }) => {
  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-white mb-3">Filter Games</h3>
      
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tokenFilter === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setTokenFilter(null)}
        >
          All Tokens
        </button>
        
        {(['native', 'asa', 'arc200'] as TokenType[]).map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tokenFilter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setTokenFilter(type)}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-gray-400 text-xs">
        Tokens available: {tokens.map(t => t.symbol).join(', ')}
      </div>
    </div>
  );
};

export default GameFilter;