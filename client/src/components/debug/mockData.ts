import { Card, PublicPlayer, PublicGameState } from '../../types';
import { RoundScore } from '../../context/GameContext';

let cardIdCounter = 1;

function createCard(type: Card['type']): Card {
  return { id: `card-${cardIdCounter++}`, type };
}

// Sample played cards for different scenarios
function createRound1Cards(): Card[] {
  return [
    createCard('tempura'),
    createCard('tempura'),
    createCard('sashimi'),
    createCard('nigiri_salmon'),
    createCard('maki2'),
    createCard('dumpling'),
    createCard('dumpling'),
  ];
}

function createRound2Cards(): Card[] {
  return [
    createCard('wasabi'),
    createCard('nigiri_squid'),
    createCard('sashimi'),
    createCard('sashimi'),
    createCard('maki3'),
    createCard('pudding'),
  ];
}

function createRound3Cards(): Card[] {
  return [
    createCard('tempura'),
    createCard('sashimi'),
    createCard('sashimi'),
    createCard('sashimi'),
    createCard('dumpling'),
    createCard('dumpling'),
    createCard('dumpling'),
    createCard('maki1'),
    createCard('pudding'),
  ];
}

function createOpponentRound1Cards(): Card[] {
  return [
    createCard('maki3'),
    createCard('maki2'),
    createCard('nigiri_egg'),
    createCard('nigiri_salmon'),
    createCard('tempura'),
    createCard('chopsticks'),
  ];
}

function createOpponentRound2Cards(): Card[] {
  return [
    createCard('tempura'),
    createCard('tempura'),
    createCard('dumpling'),
    createCard('dumpling'),
    createCard('dumpling'),
    createCard('dumpling'),
    createCard('maki1'),
  ];
}

function createOpponentRound3Cards(): Card[] {
  return [
    createCard('wasabi'),
    createCard('nigiri_salmon'),
    createCard('sashimi'),
    createCard('maki2'),
    createCard('pudding'),
    createCard('pudding'),
  ];
}

// Create a hand for mid-round view
export function createMockHand(): Card[] {
  return [
    createCard('tempura'),
    createCard('sashimi'),
    createCard('nigiri_squid'),
    createCard('maki2'),
    createCard('dumpling'),
    createCard('pudding'),
    createCard('wasabi'),
  ];
}

// Create mock players
export function createMockPlayers(scenario: 'mid-round' | 'round-end' | 'game-end'): PublicPlayer[] {
  const currentRound = scenario === 'game-end' ? 3 : scenario === 'round-end' ? 2 : 1;

  const player1PlayedCards: Card[][] = [];
  const player2PlayedCards: Card[][] = [];

  if (currentRound >= 1) {
    player1PlayedCards.push(createRound1Cards());
    player2PlayedCards.push(createOpponentRound1Cards());
  }
  if (currentRound >= 2) {
    player1PlayedCards.push(createRound2Cards());
    player2PlayedCards.push(createOpponentRound2Cards());
  }
  if (currentRound >= 3) {
    player1PlayedCards.push(createRound3Cards());
    player2PlayedCards.push(createOpponentRound3Cards());
  }

  // For mid-round, show partial cards for current round
  if (scenario === 'mid-round') {
    player1PlayedCards[0] = player1PlayedCards[0].slice(0, 4);
    player2PlayedCards[0] = player2PlayedCards[0].slice(0, 3);
  }

  return [
    {
      id: 'player-1',
      name: 'You',
      playedCards: player1PlayedCards,
      score: scenario === 'game-end' ? 47 : scenario === 'round-end' ? 24 : 12,
      puddings: scenario === 'game-end' ? 2 : scenario === 'round-end' ? 1 : 0,
      hasConfirmed: scenario === 'mid-round' ? false : true,
      isConnected: true,
      handSize: scenario === 'mid-round' ? 7 : 0,
      seatIndex: 0,
    },
    {
      id: 'player-2',
      name: 'Alice',
      playedCards: player2PlayedCards,
      score: scenario === 'game-end' ? 52 : scenario === 'round-end' ? 28 : 8,
      puddings: scenario === 'game-end' ? 3 : scenario === 'round-end' ? 0 : 0,
      hasConfirmed: true,
      isConnected: true,
      handSize: scenario === 'mid-round' ? 7 : 0,
      seatIndex: 1,
    },
    {
      id: 'player-3',
      name: 'Bob',
      playedCards: player2PlayedCards.map(cards => [...cards].reverse()),
      score: scenario === 'game-end' ? 38 : scenario === 'round-end' ? 18 : 5,
      puddings: scenario === 'game-end' ? 1 : scenario === 'round-end' ? 1 : 0,
      hasConfirmed: true,
      isConnected: true,
      handSize: scenario === 'mid-round' ? 7 : 0,
      seatIndex: 2,
    },
    {
      id: 'player-4',
      name: 'Charlie',
      playedCards: player1PlayedCards.map(cards => [...cards].slice(0, -2)),
      score: scenario === 'game-end' ? 41 : scenario === 'round-end' ? 20 : 10,
      puddings: scenario === 'game-end' ? 0 : scenario === 'round-end' ? 0 : 0,
      hasConfirmed: scenario === 'mid-round' ? false : true,
      isConnected: true,
      handSize: scenario === 'mid-round' ? 7 : 0,
      seatIndex: 3,
    },
  ];
}

// Create mock game state
export function createMockGameState(scenario: 'mid-round' | 'round-end' | 'game-end'): PublicGameState {
  const players = createMockPlayers(scenario);

  return {
    id: 'debug-game',
    code: 'DEBUG',
    phase: scenario === 'mid-round' ? 'playing' : scenario === 'round-end' ? 'round_end' : 'game_end',
    players,
    currentRound: scenario === 'game-end' ? 3 : scenario === 'round-end' ? 2 : 1,
    currentTurn: scenario === 'mid-round' ? 5 : scenario === 'round-end' ? 10 : 10,
    maxPlayers: 4,
  };
}

// Create mock round scores
export function createMockRoundScores(players: PublicPlayer[]): RoundScore[] {
  return players.map(p => ({
    playerId: p.id,
    roundScore: Math.floor(Math.random() * 15) + 5,
    totalScore: p.score,
  }));
}

// Create mock final scores
export function createMockFinalScores(players: PublicPlayer[]): { playerId: string; totalScore: number; puddings: number }[] {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map(p => ({
      playerId: p.id,
      totalScore: p.score,
      puddings: p.puddings,
    }));
}
