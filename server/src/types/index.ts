// Card Types
export type CardType =
  | 'tempura'
  | 'sashimi'
  | 'dumpling'
  | 'maki1'
  | 'maki2'
  | 'maki3'
  | 'nigiri_egg'
  | 'nigiri_salmon'
  | 'nigiri_squid'
  | 'wasabi'
  | 'pudding'
  | 'chopsticks';

export interface Card {
  id: string;
  type: CardType;
}

// Player state
export interface Player {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  playedCards: Card[][];  // Cards played each round [round][cards]
  selectedCards: Card[];  // Currently selected cards for this turn
  hasConfirmed: boolean;
  score: number;
  puddings: number;       // Track puddings separately for end-game scoring
  isConnected: boolean;
  seatIndex: number | null;  // 0-3, null if not seated
}

// Game phases
export type GamePhase = 'lobby' | 'playing' | 'round_end' | 'game_end';

// Game state
export interface GameState {
  id: string;
  code: string;
  phase: GamePhase;
  players: Player[];
  hostSocketId: string;
  currentRound: number;    // 1-3
  currentTurn: number;     // Tracks turn within round
  maxPlayers: number;
  cardsPerHand: number;
}

// Socket events - Server to Client
export interface ServerToClientEvents {
  'game:created': (data: { gameCode: string; gameId: string; gameState: PublicGameState }) => void;
  'game:error': (data: { message: string }) => void;
  'player:joined': (data: { player: PublicPlayer; players: PublicPlayer[]; gameState: PublicGameState }) => void;
  'player:left': (data: { playerId: string; players: PublicPlayer[] }) => void;
  'game:started': (data: { gameState: PublicGameState }) => void;
  'hand:dealt': (data: { hand: Card[] }) => void;
  'player:ready': (data: { playerId: string }) => void;
  'cards:revealed': (data: {
    revealedCards: { playerId: string; cards: Card[] }[];
    gameState: PublicGameState;
  }) => void;
  'round:end': (data: {
    scores: { playerId: string; roundScore: number; totalScore: number }[];
    gameState: PublicGameState;
  }) => void;
  'game:end': (data: {
    finalScores: { playerId: string; totalScore: number; puddings: number }[];
    winner: string;
  }) => void;
  'state:update': (data: { gameState: PublicGameState }) => void;
}

// Socket events - Client to Server
export interface ClientToServerEvents {
  'game:create': () => void;
  'game:join': (data: { code: string; name: string }) => void;
  'game:start': () => void;
  'seat:select': (data: { seatIndex: number }) => void;
  'card:select': (data: { cardIds: string[] }) => void;
  'card:confirm': () => void;
  'game:restart': () => void;
}

// Public player info (sent to clients - hides hand)
export interface PublicPlayer {
  id: string;
  name: string;
  playedCards: Card[][];
  score: number;
  puddings: number;
  hasConfirmed: boolean;
  isConnected: boolean;
  handSize: number;
  seatIndex: number | null;  // 0-3, null if not seated
}

// Public game state (sent to clients)
export interface PublicGameState {
  id: string;
  code: string;
  phase: GamePhase;
  players: PublicPlayer[];
  currentRound: number;
  currentTurn: number;
  maxPlayers: number;
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
  chopsticks: 4
};

// Cards per hand based on player count
export const CARDS_PER_PLAYER: Record<number, number> = {
  2: 10,
  3: 9,
  4: 8,
  5: 7
};
