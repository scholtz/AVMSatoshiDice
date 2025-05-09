import { useState } from 'react';
import { GamePlay, Game } from '../types';
import { calculatePotentialWin } from '../utils/formatters';

export const useGamePlay = (game: Game | undefined, updateGame: (game: Game) => void) => {
  const [amount, setAmount] = useState<number>(0);
  const [probability, setProbability] = useState<number>(500000); // Default 50%
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ won: boolean; amount: number } | null>(null);
  
  // Calculate potential win based on current inputs
  const potentialWin = game ? calculatePotentialWin(amount, probability) : 0;
  
  // Check if play is valid (amount > 0, probability valid, potential win <= game balance)
  const isPlayValid = useMemo(() => {
    if (!game || amount <= 0) return false;
    if (probability < 1 || probability > 1000000) return false;
    return potentialWin <= game.balance;
  }, [game, amount, probability, potentialWin]);
  
  // Start the game
  const startGame = () => {
    if (!isPlayValid || !game) return;
    
    setIsPlaying(true);
    setResult(null);
    
    // In a real implementation, this would interact with the blockchain
    // For now, we'll simulate the first step of the game
    setTimeout(() => {
      setIsProcessing(true);
    }, 1000);
  };
  
  // Claim the result
  const claimResult = () => {
    if (!isProcessing || !game) return;
    
    // Simulate a game result (random win/lose)
    // In a real implementation, this would verify the result from the blockchain
    const random = Math.random() * 1000000;
    const won = random <= probability;
    
    // Update the game state with the result
    const updatedGame = { ...game };
    const now = new Date().toISOString();
    
    updatedGame.lastPlayTime = now;
    
    if (won) {
      const winAmount = potentialWin - amount;
      updatedGame.lastWinTime = now;
      updatedGame.balance -= potentialWin - amount;
      
      if (!updatedGame.biggestWin || winAmount > updatedGame.biggestWin.amount) {
        updatedGame.biggestWin = {
          amount: winAmount,
          time: now,
        };
      }
      
      setResult({ won: true, amount: winAmount });
    } else {
      updatedGame.balance += amount;
      setResult({ won: false, amount });
    }
    
    updateGame(updatedGame);
    setIsPlaying(false);
    setIsProcessing(false);
  };
  
  // Reset the game state
  const resetGame = () => {
    setAmount(0);
    setProbability(500000);
    setIsPlaying(false);
    setIsProcessing(false);
    setResult(null);
  };
  
  return {
    amount,
    setAmount,
    probability,
    setProbability,
    potentialWin,
    isPlayValid,
    isPlaying,
    isProcessing,
    result,
    startGame,
    claimResult,
    resetGame,
  };
};