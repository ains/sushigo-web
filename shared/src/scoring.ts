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

// Score breakdown item for display
export interface ScoreItem {
  label: string;
  cards: Card[];
  points: number;
  description?: string;
}

// Scoring constants
export const DUMPLING_POINTS = [0, 1, 3, 6, 10, 15] as const;

export const NIGIRI_VALUES: Record<string, number> = {
  'nigiri_squid': 3,
  'nigiri_salmon': 2,
  'nigiri_egg': 1
};

const NIGIRI_NAMES: Record<string, string> = {
  'nigiri_egg': 'Egg',
  'nigiri_salmon': 'Salmon',
  'nigiri_squid': 'Squid'
};

// Count cards of specific types
function countCardType(cards: Card[], ...types: string[]): number {
  return cards.filter(c => types.includes(c.type)).length;
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

// Calculate detailed score breakdown for a round's cards
export function calculateScoreBreakdown(cards: Card[]): ScoreItem[] {
  const items: ScoreItem[] = [];

  // Separate cards by type
  const tempuras = cards.filter(c => c.type === 'tempura');
  const sashimis = cards.filter(c => c.type === 'sashimi');
  const dumplings = cards.filter(c => c.type === 'dumpling');
  const makis = cards.filter(c => c.type.startsWith('maki'));
  const puddings = cards.filter(c => c.type === 'pudding');
  const chopsticks = cards.filter(c => c.type === 'chopsticks');

  // Process nigiri and wasabi in play order
  const wasabiNigiriPairs: { wasabi: Card; nigiri: Card }[] = [];
  const standaloneNigiris: Card[] = [];
  const unusedWasabis: Card[] = [];
  const pendingWasabis: Card[] = [];

  for (const card of cards) {
    if (card.type === 'wasabi') {
      pendingWasabis.push(card);
    } else if (card.type.startsWith('nigiri_')) {
      if (pendingWasabis.length > 0) {
        wasabiNigiriPairs.push({
          wasabi: pendingWasabis.shift()!,
          nigiri: card,
        });
      } else {
        standaloneNigiris.push(card);
      }
    }
  }
  unusedWasabis.push(...pendingWasabis);

  // Tempura: 5 pts per pair
  if (tempuras.length > 0) {
    const pairs = Math.floor(tempuras.length / 2);
    const points = pairs * 5;
    items.push({
      label: 'Tempura',
      cards: tempuras,
      points,
      description: pairs > 0
        ? `${pairs} pair${pairs > 1 ? 's' : ''} = ${points} pts`
        : '2 needed for 5 pts',
    });
  }

  // Sashimi: 10 pts per set of 3
  if (sashimis.length > 0) {
    const sets = Math.floor(sashimis.length / 3);
    const points = sets * 10;
    items.push({
      label: 'Sashimi',
      cards: sashimis,
      points,
      description: sets > 0
        ? `${sets} set${sets > 1 ? 's' : ''} = ${points} pts`
        : '3 needed for 10 pts',
    });
  }

  // Dumplings: 1/3/6/10/15
  if (dumplings.length > 0) {
    const points = DUMPLING_POINTS[Math.min(dumplings.length, 5)];
    items.push({
      label: 'Dumplings',
      cards: dumplings,
      points,
      description: `${dumplings.length} dumpling${dumplings.length > 1 ? 's' : ''} = ${points} pts`,
    });
  }

  // Wasabi + Nigiri combos
  for (const { wasabi, nigiri } of wasabiNigiriPairs) {
    const basePoints = NIGIRI_VALUES[nigiri.type];
    const points = basePoints * 3;
    items.push({
      label: `Wasabi + ${NIGIRI_NAMES[nigiri.type]}`,
      cards: [wasabi, nigiri],
      points,
      description: `${basePoints} x 3 = ${points} pts`,
    });
  }

  // Standalone nigiris
  if (standaloneNigiris.length > 0) {
    const points = standaloneNigiris.reduce((sum, card) => {
      return sum + (NIGIRI_VALUES[card.type] || 0);
    }, 0);
    items.push({
      label: 'Nigiri',
      cards: standaloneNigiris,
      points,
    });
  }

  // Unused wasabi
  if (unusedWasabis.length > 0) {
    items.push({
      label: 'Unused Wasabi',
      cards: unusedWasabis,
      points: 0,
      description: 'No nigiri to enhance',
    });
  }

  // Maki - points calculated separately with rankings
  if (makis.length > 0) {
    items.push({
      label: 'Maki Rolls',
      cards: makis,
      points: 0,
    });
  }

  // Pudding - end-game scoring
  if (puddings.length > 0) {
    items.push({
      label: 'Pudding',
      cards: puddings,
      points: 0,
      description: `${puddings.length} saved for end`,
    });
  }

  // Chopsticks
  if (chopsticks.length > 0) {
    items.push({
      label: 'Chopsticks',
      cards: chopsticks,
      points: 0,
      description: 'Not used',
    });
  }

  return items;
}

// Score all non-comparative cards for a round
export function scoreRoundCards(cards: Card[]): number {
  const breakdown = calculateScoreBreakdown(cards);
  return breakdown.reduce((sum, item) => sum + item.points, 0);
}

// Calculate a single player's maki bonus given all players' maki counts
export function calculateMakiBonus(playerMaki: number, allPlayerMakis: number[]): number {
  if (playerMaki === 0) return 0;

  const sorted = [...allPlayerMakis].sort((a, b) => b - a);
  const highest = sorted[0];
  const firstPlaceCount = allPlayerMakis.filter(m => m === highest).length;

  if (playerMaki === highest) {
    if (firstPlaceCount > 1) {
      // Split 6 points among tied players
      return Math.floor(6 / firstPlaceCount);
    }
    return 6;
  }

  // Check for second place (only if there's a single first place winner)
  if (firstPlaceCount === 1) {
    const secondHighest = sorted.find(m => m < highest) ?? 0;
    if (playerMaki === secondHighest && secondHighest > 0) {
      const secondPlaceCount = allPlayerMakis.filter(m => m === secondHighest).length;
      return Math.floor(3 / secondPlaceCount);
    }
  }

  return 0;
}

// Score maki for all players (comparative scoring)
export function scoreMakiForPlayers(players: PlayerMakiData[]): Map<string, number> {
  const scores = new Map<string, number>();
  const allMakiCounts = players.map(p => countMaki(p.roundCards));

  for (let i = 0; i < players.length; i++) {
    const bonus = calculateMakiBonus(allMakiCounts[i], allMakiCounts);
    if (bonus > 0) {
      scores.set(players[i].id, bonus);
    }
  }

  return scores;
}

// Calculate a single player's pudding bonus given all players' pudding counts
export function calculatePuddingBonus(playerPuddings: number, allPlayerPuddings: number[]): number {
  if (allPlayerPuddings.length === 0) return 0;

  const sorted = [...allPlayerPuddings].sort((a, b) => b - a);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  let bonus = 0;

  // Most puddings: +6 (split if tied)
  if (playerPuddings === highest) {
    const tiedCount = allPlayerPuddings.filter(p => p === highest).length;
    bonus += Math.floor(6 / tiedCount);
  }

  // Least puddings: -6 (split if tied), but not in 2-player games
  if (allPlayerPuddings.length > 2 && playerPuddings === lowest && lowest < highest) {
    const tiedCount = allPlayerPuddings.filter(p => p === lowest).length;
    bonus -= Math.floor(6 / tiedCount);
  }

  return bonus;
}

// Score puddings at end of game (comparative scoring)
export function scorePuddingsForPlayers(players: PlayerPuddingData[]): Map<string, number> {
  const scores = new Map<string, number>();
  if (players.length === 0) return scores;

  const allPuddingCounts = players.map(p => p.puddings);

  for (const player of players) {
    const bonus = calculatePuddingBonus(player.puddings, allPuddingCounts);
    if (bonus !== 0) {
      scores.set(player.id, bonus);
    }
  }

  return scores;
}
