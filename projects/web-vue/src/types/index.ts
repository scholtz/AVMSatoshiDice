export type TokenType = "native" | "asa" | "arc200";

export interface Token {
  id: string;
  unitName: string;
  name: string;
  type: TokenType;
  logoUrl?: string;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  creator: string;
  token: Token;
  winRatio: number; // percentage (0-100)
  balance: number;
  minBet?: number;
  maxBet?: number;
  lastPlayTime?: Date;
  lastWinTime?: Date;
  biggestWin?: {
    amount: number;
    time: Date;
    player: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GamePlay {
  id: string;
  gameId: string;
  player: string;
  betAmount: number;
  winProbability: number; // 1-1000000 where 1000000 is 100%
  potentialWinAmount: number;
  isWin?: boolean;
  winAmount?: number;
  status: "pending" | "deposited" | "claimed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  address: string;
  balance: Record<string, number>; // tokenId -> balance
}
