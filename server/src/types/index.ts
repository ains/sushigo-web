// Re-export all shared types
export * from 'sushigo-shared';

// Import types needed for server-specific definitions
import type { Card, CardType, GamePhase, PublicPlayer } from 'sushigo-shared';

// Player state (server-only - includes private hand)
export interface Player {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  playedCards: Card[][]; // Cards played each round [round][cards]
  selectedCards: Card[]; // Currently selected cards for this turn
  hasConfirmed: boolean;
  score: number;
  puddings: number; // Track puddings separately for end-game scoring
  isConnected: boolean;
  seatIndex: number | null; // 0-3, null if not seated
}

// Game state (server-only - includes full player state)
export interface GameState {
  id: string;
  code: string;
  phase: GamePhase;
  players: Player[];
  hostSocketId: string;
  currentRound: number; // 1-3
  currentTurn: number; // Tracks turn within round
  maxPlayers: number;
  cardsPerHand: number;
}

// Deck configuration
export const DECK_CONFIG: Record<CardType, number> = {
  tempura: 14,
  sashimi: 14,
  dumpling: 14,
  maki3: 8,
  maki2: 12,
  maki1: 6,
  nigiri_salmon: 10,
  nigiri_squid: 5,
  nigiri_egg: 5,
  wasabi: 6,
  pudding: 10,
  chopsticks: 4,
};

// Cards per hand based on player count
export const CARDS_PER_PLAYER: Record<number, number> = {
  2: 10,
  3: 9,
  4: 8,
  5: 7,
};
