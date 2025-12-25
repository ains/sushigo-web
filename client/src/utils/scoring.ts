import { Card } from '../types';

/**
 * Calculate the current round points from played cards.
 * Does not include maki (comparative) or pudding (end-game).
 */
export function calculateRoundPoints(cards: Card[]): number {
  let points = 0;

  // Count card types
  const tempuraCount = cards.filter(c => c.type === 'tempura').length;
  const sashimiCount = cards.filter(c => c.type === 'sashimi').length;
  const dumplingCount = cards.filter(c => c.type === 'dumpling').length;

  // Tempura: 5 pts per pair
  points += Math.floor(tempuraCount / 2) * 5;

  // Sashimi: 10 pts per set of 3
  points += Math.floor(sashimiCount / 3) * 10;

  // Dumpling: 1/3/6/10/15 for 1/2/3/4/5+
  const dumplingPoints = [0, 1, 3, 6, 10, 15];
  points += dumplingPoints[Math.min(dumplingCount, 5)];

  // Nigiri with wasabi - wasabi triples the next nigiri
  // Cards are in play order, so we process them sequentially
  let unusedWasabi = 0;
  for (const card of cards) {
    if (card.type === 'wasabi') {
      unusedWasabi++;
    } else if (card.type === 'nigiri_egg') {
      const basePoints = 1;
      if (unusedWasabi > 0) {
        points += basePoints * 3;
        unusedWasabi--;
      } else {
        points += basePoints;
      }
    } else if (card.type === 'nigiri_salmon') {
      const basePoints = 2;
      if (unusedWasabi > 0) {
        points += basePoints * 3;
        unusedWasabi--;
      } else {
        points += basePoints;
      }
    } else if (card.type === 'nigiri_squid') {
      const basePoints = 3;
      if (unusedWasabi > 0) {
        points += basePoints * 3;
        unusedWasabi--;
      } else {
        points += basePoints;
      }
    }
  }

  return points;
}
