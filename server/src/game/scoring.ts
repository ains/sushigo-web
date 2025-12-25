import { Card, Player } from '../types/index.js';

// Get all cards played this round by a player
function getRoundCards(player: Player, round: number): Card[] {
  return player.playedCards[round - 1] || [];
}

// Count cards of a specific type
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

// Score nigiri with wasabi: base value, tripled if wasabi available
export function scoreNigiri(cards: Card[]): number {
  let score = 0;
  let wasabiCount = countCardType(cards, 'wasabi');

  // Sort cards so we process nigiri in order (highest value first for wasabi)
  const nigiriValues: Record<string, number> = {
    'nigiri_squid': 3,
    'nigiri_salmon': 2,
    'nigiri_egg': 1
  };

  // Get all nigiri sorted by value (highest first)
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

// Count maki rolls
export function countMaki(cards: Card[]): number {
  let count = 0;
  for (const card of cards) {
    if (card.type === 'maki1') count += 1;
    else if (card.type === 'maki2') count += 2;
    else if (card.type === 'maki3') count += 3;
  }
  return count;
}

// Score maki for all players (comparative scoring)
export function scoreMakiForPlayers(players: Player[], round: number): Map<string, number> {
  const scores = new Map<string, number>();

  // Count maki for each player
  const makiCounts: { playerId: string; count: number }[] = players.map(p => ({
    playerId: p.id,
    count: countMaki(getRoundCards(p, round))
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

// Score a single player's round (excluding maki - that's comparative)
export function scorePlayerRound(player: Player, round: number): number {
  const cards = getRoundCards(player, round);

  let score = 0;
  score += scoreTempura(cards);
  score += scoreSashimi(cards);
  score += scoreDumplings(cards);
  score += scoreNigiri(cards);
  // Maki is scored separately via scoreMakiForPlayers

  return score;
}

// Score puddings at end of game (comparative scoring)
export function scorePuddingsForPlayers(players: Player[]): Map<string, number> {
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

// Count puddings in cards and update player
export function countPuddingsInCards(cards: Card[]): number {
  return countCardType(cards, 'pudding');
}
