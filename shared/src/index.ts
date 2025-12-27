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

// Game phases
export type GamePhase = 'lobby' | 'playing' | 'round_end' | 'game_end';

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
  seatIndex: number | null;
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

// View mode
export type ViewMode = 'tablet' | 'mobile';

// Socket events - Server to Client
export interface ServerToClientEvents {
  'game:created': (data: { gameCode: string; gameId: string; gameState: PublicGameState }) => void;
  'game:error': (data: { message: string }) => void;
  'player:joined': (data: {
    player: PublicPlayer;
    players: PublicPlayer[];
    gameState: PublicGameState;
  }) => void;
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

// Re-export scoring functions
export * from './scoring.js';
