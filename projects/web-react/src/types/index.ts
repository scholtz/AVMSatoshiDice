export type TokenType = 'native' | 'asa' | 'arc200';

export interface Token {
  id: string;
  name: string;
  type: TokenType;
  symbol: string;
}

export interface Game {
  id: string;
  name: string;
  token: Token;
  balance: number;
  winRatio: number; // Percentage (e.g., 80 means 80%)
  createdAt: string;
  lastPlayTime: string | null;
  lastWinTime: string | null;
  biggestWin: {
    amount: number;
    time: string;
  } | null;
  owner: string;
}

export interface GamePlay {
  gameId: string;
  amount: number;
  probability: number; // 1-1000000
}