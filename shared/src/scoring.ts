import type { Card } from './index.js';

// Minimal player data needed for comparative scoring
export interface PlayerMakiData {
  id: string;
  roundCards: Card[];
}

export interface PlayerPuddingData {
  id: string;
  puddings: number;
}

// Count cards of specific types
function countCardType(cards: Card[], ...types: string[]): number {
  return cards.filter(c => types.includes(c.type)).length;
}

// Score tempura: 5 points per pair
export function scoreTempura(cards: Card[]): number {
  const count = countCardType(cards, 'tempura');
  return Math.floor(count / 2) * 5;
}

// Score sashimi: 10 points per set of 3
export function scoreSashimi(cards: Card[]): number {
  const count = countCardType(cards, 'sashimi');
  return Math.floor(count / 3) * 10;
}

// Score dumplings: 1/3/6/10/15 points for 1/2/3/4/5+ dumplings
export function scoreDumplings(cards: Card[]): number {
  const count = countCardType(cards, 'dumpling');
  const scores = [0, 1, 3, 6, 10, 15];
  return scores[Math.min(count, 5)];
}

// Score nigiri with wasabi
// Wasabi triples the next nigiri - we assign wasabi to highest value nigiri first
export function scoreNigiri(cards: Card[]): number {
  let score = 0;
  let wasabiCount = countCardType(cards, 'wasabi');

  const nigiriValues: Record<string, number> = {
    'nigiri_squid': 3,
    'nigiri_salmon': 2,
    'nigiri_egg': 1
  };

  // Get all nigiri sorted by value (highest first to maximize wasabi usage)
  const nigiriCards = cards
    .filter(c => c.type.startsWith('nigiri_'))
    .sort((a, b) => nigiriValues[b.type] - nigiriValues[a.type]);

  for (const nigiri of nigiriCards) {
    const baseValue = nigiriValues[nigiri.type];
    if (wasabiCount > 0) {
      score += baseValue * 3;
      wasabiCount--;
    } else {
      score += baseValue;
    }
  }

  return score;
}

// Count maki rolls in cards
export function countMaki(cards: Card[]): number {
  let count = 0;
  for (const card of cards) {
    if (card.type === 'maki1') count += 1;
    else if (card.type === 'maki2') count += 2;
    else if (card.type === 'maki3') count += 3;
  }
  return count;
}

// Count puddings in cards
export function countPuddings(cards: Card[]): number {
  return countCardType(cards, 'pudding');
}

// Score all non-comparative cards for a round
export function scoreRoundCards(cards: Card[]): number {
  let score = 0;
  score += scoreTempura(cards);
  score += scoreSashimi(cards);
  score += scoreDumplings(cards);
  score += scoreNigiri(cards);
  // Maki is scored separately via scoreMakiForPlayers
  return score;
}

// Score maki for all players (comparative scoring)
export function scoreMakiForPlayers(players: PlayerMakiData[]): Map<string, number> {
  const scores = new Map<string, number>();

  // Count maki for each player
  const makiCounts: { playerId: string; count: number }[] = players.map(p => ({
    playerId: p.id,
    count: countMaki(p.roundCards)
  }));

  // Sort by count descending
  makiCounts.sort((a, b) => b.count - a.count);

  // Find 1st place (players with most maki)
  const firstPlaceCount = makiCounts[0]?.count || 0;
  if (firstPlaceCount === 0) {
    // No one has maki
    return scores;
  }

  const firstPlacePlayers = makiCounts.filter(p => p.count === firstPlaceCount);

  if (firstPlacePlayers.length === 1) {
    // Single winner gets 6 points
    scores.set(firstPlacePlayers[0].playerId, 6);

    // Find 2nd place
    const secondPlaceCount = makiCounts.find(p => p.count < firstPlaceCount)?.count || 0;
    if (secondPlaceCount > 0) {
      const secondPlacePlayers = makiCounts.filter(p => p.count === secondPlaceCount);
      const secondPlacePoints = Math.floor(3 / secondPlacePlayers.length);
      for (const player of secondPlacePlayers) {
        scores.set(player.playerId, secondPlacePoints);
      }
    }
  } else {
    // Tie for first - split 6 points
    const pointsPerPlayer = Math.floor(6 / firstPlacePlayers.length);
    for (const player of firstPlacePlayers) {
      scores.set(player.playerId, pointsPerPlayer);
    }
    // No second place points awarded when there's a tie for first
  }

  return scores;
}

// Score puddings at end of game (comparative scoring)
export function scorePuddingsForPlayers(players: PlayerPuddingData[]): Map<string, number> {
  const scores = new Map<string, number>();

  if (players.length === 0) return scores;

  // Find most and least puddings
  const puddingCounts = players.map(p => p.puddings);
  const maxPuddings = Math.max(...puddingCounts);
  const minPuddings = Math.min(...puddingCounts);

  // Most puddings: +6 points (split if tied)
  const mostPuddingPlayers = players.filter(p => p.puddings === maxPuddings);
  const mostPoints = Math.floor(6 / mostPuddingPlayers.length);
  for (const player of mostPuddingPlayers) {
    scores.set(player.id, mostPoints);
  }

  // Least puddings: -6 points (split if tied)
  // In 2-player game, no one loses points for least puddings
  if (players.length > 2 && minPuddings !== maxPuddings) {
    const leastPuddingPlayers = players.filter(p => p.puddings === minPuddings);
    const leastPoints = Math.floor(-6 / leastPuddingPlayers.length);
    for (const player of leastPuddingPlayers) {
      const current = scores.get(player.id) || 0;
      scores.set(player.id, current + leastPoints);
    }
  }

  return scores;
}
