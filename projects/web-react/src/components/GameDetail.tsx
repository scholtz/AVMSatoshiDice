import React, { useState } from 'react';
import { Game } from '../types';
import { formatCurrency, formatDate, timeAgo } from '../utils/formatters';
import { ArrowLeft, Award, Clock, Trophy, Users } from 'lucide-react';
import GamePlay from './GamePlay';

interface GameDetailProps {
  game: Game;
  onBack: () => void;
  onUpdateGame: (game: Game) => void;
  isOwner: boolean;
}

const GameDetail: React.FC<GameDetailProps> = ({ 
  game, 
  onBack, 
  onUpdateGame,
  isOwner = false,
}) => {
  const [showManage, setShowManage] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const updatedGame = {
      ...game,
      balance: game.balance + amount
    };
    
    onUpdateGame(updatedGame);
    setDepositAmount('');
    setShowManage(false);
  };
  
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > game.balance) return;
    
    const updatedGame = {
      ...game,
      balance: game.balance - amount
    };
    
    onUpdateGame(updatedGame);
    setWithdrawAmount('');
    setShowManage(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        className="flex items-center text-indigo-400 hover:text-indigo-300 mb-4"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Games
      </button>
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div>
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-white mr-3">{game.name}</h2>
                <span className="px-3 py-1 bg-indigo-900 rounded-full text-xs font-semibold text-indigo-200">
                  {game.token.symbol}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Created on {formatDate(game.createdAt)}</p>
            </div>
            
            {isOwner && (
              <button 
                className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => setShowManage(!showManage)}
              >
                {showManage ? 'Cancel' : 'Manage Game'}
              </button>
            )}
          </div>
          
          {showManage ? (
            <div className="bg-gray-900 p-5 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Manage Game Balance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Deposit {game.token.symbol}
                  </label>
                  <div className="flex">
                    <input 
                      type="number"
                      className="flex-1 bg-gray-800 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r-lg transition-colors"
                      onClick={handleDeposit}
                    >
                      Deposit
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Withdraw {game.token.symbol}
                  </label>
                  <div className="flex">
                    <input 
                      type="number"
                      className="flex-1 bg-gray-800 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={game.balance}
                    />
                    <button 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r-lg transition-colors"
                      onClick={handleWithdraw}
                      disabled={parseFloat(withdrawAmount) > game.balance}
                    >
                      Withdraw
                    </button>
                  </div>
                  {parseFloat(withdrawAmount) > game.balance && (
                    <p className="text-red-500 text-xs mt-1">
                      Cannot withdraw more than the current balance
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Win Ratio</div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{game.winRatio}%</span>
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Balance</div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(game.balance, game.token.symbol)}
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Biggest Win</div>
                <div className="text-2xl font-bold text-white">
                  {game.biggestWin 
                    ? formatCurrency(game.biggestWin.amount, game.token.symbol)
                    : 'None yet'}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              <div>
                <div className="text-xs">Last Play</div>
                <div>{timeAgo(game.lastPlayTime)}</div>
              </div>
            </div>
            
            <div className="flex items-center text-gray-400">
              <Trophy className="h-4 w-4 mr-2" />
              <div>
                <div className="text-xs">Last Win</div>
                <div>{timeAgo(game.lastWinTime)}</div>
              </div>
            </div>
            
            <div className="flex items-center text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              <div>
                <div className="text-xs">Owner</div>
                <div className="truncate max-w-[200px]">{game.owner}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!showManage && (
        <GamePlay game={game} onUpdateGame={onUpdateGame} />
      )}
    </div>
  );
};

export default GameDetail;