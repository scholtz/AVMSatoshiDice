import React, { useState } from 'react';
import { Game } from '../types';
import { formatCurrency, formatProbability, calculatePotentialWin } from '../utils/formatters';
import { Dice1 as Dice, ArrowRight, X, Check } from 'lucide-react';

interface GamePlayProps {
  game: Game;
  onUpdateGame: (game: Game) => void;
}

const GamePlay: React.FC<GamePlayProps> = ({ game, onUpdateGame }) => {
  const [amount, setAmount] = useState<string>('');
  const [probability, setProbability] = useState<string>('500000'); // Default to 50%
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ won: boolean; amount: number } | null>(null);
  
  const amountValue = parseFloat(amount || '0');
  const probabilityValue = parseInt(probability || '0');
  
  // Calculate potential win
  const potentialWin = calculatePotentialWin(amountValue, probabilityValue);
  
  // Check if play is valid
  const isPlayValid = 
    amountValue > 0 && 
    probabilityValue >= 1 && 
    probabilityValue <= 1000000 && 
    potentialWin <= game.balance;
  
  const handleProbabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value || '0');
    if (numValue >= 0 && numValue <= 1000000) {
      setProbability(value);
    }
  };
  
  const startGame = () => {
    if (!isPlayValid) return;
    
    setIsPlaying(true);
    setResult(null);
    
    // In a real implementation, this would interact with the blockchain
    // For now, we'll simulate the first step of the game
    setTimeout(() => {
      setIsProcessing(true);
    }, 1500);
  };
  
  const claimResult = () => {
    if (!isProcessing) return;
    
    // Simulate a game result (random win/lose)
    // In a real implementation, this would verify the result from the blockchain
    const random = Math.random() * 1000000;
    const won = random <= probabilityValue;
    
    // Update the game state with the result
    const updatedGame = { ...game };
    const now = new Date().toISOString();
    
    updatedGame.lastPlayTime = now;
    
    if (won) {
      const winAmount = potentialWin - amountValue;
      updatedGame.lastWinTime = now;
      updatedGame.balance -= winAmount;
      
      if (!updatedGame.biggestWin || winAmount > updatedGame.biggestWin.amount) {
        updatedGame.biggestWin = {
          amount: winAmount,
          time: now,
        };
      }
      
      setResult({ won: true, amount: winAmount });
    } else {
      updatedGame.balance += amountValue;
      setResult({ won: false, amount: amountValue });
    }
    
    onUpdateGame(updatedGame);
    setIsPlaying(false);
    setIsProcessing(false);
  };
  
  const resetGame = () => {
    setAmount('');
    setProbability('500000');
    setIsPlaying(false);
    setIsProcessing(false);
    setResult(null);
  };
  
  // Render different content based on game state
  const renderGameContent = () => {
    if (result) {
      return (
        <div className="text-center py-6">
          <div className={`text-6xl mb-4 ${result.won ? 'text-green-500' : 'text-red-500'}`}>
            {result.won ? <Check className="mx-auto h-16 w-16" /> : <X className="mx-auto h-16 w-16" />}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {result.won ? 'You Won!' : 'You Lost'}
          </h3>
          <p className="text-lg text-gray-300 mb-6">
            {result.won 
              ? `You've won ${formatCurrency(result.amount, game.token.symbol)}!` 
              : `You've lost ${formatCurrency(result.amount, game.token.symbol)}.`}
          </p>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      );
    }
    
    if (isProcessing) {
      return (
        <div className="text-center py-6">
          <Dice className="animate-bounce mx-auto h-16 w-16 text-indigo-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Rolling the Dice...</h3>
          <p className="text-gray-400 mb-6">Your fate is being determined...</p>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors"
            onClick={claimResult}
          >
            Claim Result
          </button>
        </div>
      );
    }
    
    if (isPlaying) {
      return (
        <div className="text-center py-6">
          <div className="animate-pulse">
            <Dice className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Game Starting...</h3>
          <p className="text-gray-400 mb-6">Initializing your game on the blockchain...</p>
          <div className="flex justify-center">
            <div className="bg-gray-800 h-2 rounded-full w-48">
              <div className="bg-indigo-600 h-2 rounded-full animate-[loadingBar_1.5s_ease-in-out]"></div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Amount ({game.token.symbol})
            </label>
            <input
              type="number"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter amount to play"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Win Probability ({formatProbability(probabilityValue)})
            </label>
            <input
              type="range"
              className="w-full"
              min="1"
              max="1000000"
              value={probability}
              onChange={handleProbabilityChange}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.0001%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm">Potential Win</div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(potentialWin, game.token.symbol)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-gray-400 text-sm">Profit</div>
              <div className="text-xl font-bold text-green-500">
                {amountValue > 0 
                  ? formatCurrency(potentialWin - amountValue, game.token.symbol)
                  : formatCurrency(0, game.token.symbol)}
              </div>
            </div>
          </div>
        </div>
        
        <button
          className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors ${
            isPlayValid
              ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          onClick={startGame}
          disabled={!isPlayValid}
        >
          {!isPlayValid && amountValue > 0 && potentialWin > game.balance ? (
            'Potential win exceeds game balance'
          ) : (
            <>
              Place Bet and Roll
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
        
        {!isPlayValid && amountValue <= 0 && (
          <p className="text-red-500 text-xs mt-2">Please enter an amount to play</p>
        )}
        
        {!isPlayValid && probabilityValue <= 0 && (
          <p className="text-red-500 text-xs mt-2">Please set a valid win probability</p>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden">
      <div className="border-b border-gray-700 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Play {game.name}</h3>
      </div>
      
      <div className="p-6">
        {renderGameContent()}
      </div>
      
      <style jsx>{`
        @keyframes loadingBar {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default GamePlay;