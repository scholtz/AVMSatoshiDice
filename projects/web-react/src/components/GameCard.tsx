import React from 'react';
import { Game } from '../types';
import { formatCurrency, timeAgo } from '../utils/formatters';
import { Award, Clock, Trophy } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onClick: (gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const { id, name, token, balance, winRatio, lastPlayTime, lastWinTime, biggestWin } = game;
  
  return (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <span className="px-3 py-1 bg-indigo-900 rounded-full text-xs font-semibold text-indigo-200">
            {token.symbol}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="text-gray-300 text-sm mb-1">Win Ratio</div>
          <div className="flex items-center">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400" 
                style={{ width: `${winRatio}%` }}
              ></div>
            </div>
            <span className="ml-2 text-lg font-bold text-white">{winRatio}%</span>
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-gray-300 text-sm">Balance</div>
            <div className="text-lg font-bold text-white">{formatCurrency(balance, token.symbol)}</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-300 text-sm">Biggest Win</div>
            <div className="text-lg font-bold text-white">
              {biggestWin ? formatCurrency(biggestWin.amount, token.symbol) : 'None'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-gray-400 text-xs">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Last play: {timeAgo(lastPlayTime)}</span>
          </div>
          <div className="flex items-center">
            <Trophy className="h-3 w-3 mr-1" />
            <span>Last win: {timeAgo(lastWinTime)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 py-2 px-5 flex justify-between items-center">
        <div className="flex items-center">
          <Award className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-xs text-yellow-200">Top {100 - winRatio}% payout</span>
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-xs font-medium py-1 px-3 rounded text-gray-900 transition-colors">
          Play Now
        </button>
      </div>
    </div>
  );
};

export default GameCard;