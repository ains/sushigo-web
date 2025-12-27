import { Card } from '../types';
import { DUMPLING_POINTS, NIGIRI_VALUES, countMaki } from 'sushigo-shared';

export interface CardGroup {
  type:
    | 'tempura_set'
    | 'sashimi_set'
    | 'dumplings'
    | 'wasabi_nigiri'
    | 'nigiri'
    | 'maki'
    | 'pudding'
    | 'chopsticks'
    | 'incomplete_tempura'
    | 'incomplete_sashimi'
    | 'unused_wasabi';
  cards: Card[];
  label?: string;
}

/**
 * Groups played cards for display purposes.
 * - Tempura: grouped into sets of 2 (incomplete sets shown separately)
 * - Sashimi: grouped into sets of 3 (incomplete sets shown separately)
 * - Dumplings: all grouped together
 * - Nigiri: grouped with wasabi if played after one, otherwise grouped together
 * - Other cards: shown individually
 */
export function groupPlayedCards(cards: Card[]): CardGroup[] {
  const groups: CardGroup[] = [];

  // Separate cards by type for grouping
  const tempuras: Card[] = [];
  const sashimis: Card[] = [];
  const dumplings: Card[] = [];
  const makis: Card[] = [];
  const puddings: Card[] = [];
  const chopsticks: Card[] = [];

  // For nigiri/wasabi, we need to process in order
  const wasabiNigiriPairs: Card[][] = [];
  const standaloneNigiris: Card[] = [];
  const unusedWasabis: Card[] = [];

  // Process cards in play order for wasabi-nigiri pairing
  let pendingWasabis: Card[] = [];

  for (const card of cards) {
    if (card.type === 'tempura') {
      tempuras.push(card);
    } else if (card.type === 'sashimi') {
      sashimis.push(card);
    } else if (card.type === 'dumpling') {
      dumplings.push(card);
    } else if (card.type === 'wasabi') {
      pendingWasabis.push(card);
    } else if (card.type.startsWith('nigiri_')) {
      if (pendingWasabis.length > 0) {
        // Pair this nigiri with a wasabi
        const wasabi = pendingWasabis.shift()!;
        wasabiNigiriPairs.push([wasabi, card]);
      } else {
        standaloneNigiris.push(card);
      }
    } else if (card.type.startsWith('maki')) {
      makis.push(card);
    } else if (card.type === 'pudding') {
      puddings.push(card);
    } else if (card.type === 'chopsticks') {
      chopsticks.push(card);
    }
  }

  // Any remaining wasabis are unused
  unusedWasabis.push(...pendingWasabis);

  // Create tempura groups (sets of 2)
  const completeTempuraSets = Math.floor(tempuras.length / 2);
  for (let i = 0; i < completeTempuraSets; i++) {
    groups.push({
      type: 'tempura_set',
      cards: tempuras.slice(i * 2, i * 2 + 2),
      label: '5 pts',
    });
  }
  // Incomplete tempura
  const remainingTempuras = tempuras.slice(completeTempuraSets * 2);
  if (remainingTempuras.length > 0) {
    groups.push({
      type: 'incomplete_tempura',
      cards: remainingTempuras,
    });
  }

  // Create sashimi groups (sets of 3)
  const completeSashimiSets = Math.floor(sashimis.length / 3);
  for (let i = 0; i < completeSashimiSets; i++) {
    groups.push({
      type: 'sashimi_set',
      cards: sashimis.slice(i * 3, i * 3 + 3),
      label: '10 pts',
    });
  }
  // Incomplete sashimi
  const remainingSashimis = sashimis.slice(completeSashimiSets * 3);
  if (remainingSashimis.length > 0) {
    groups.push({
      type: 'incomplete_sashimi',
      cards: remainingSashimis,
    });
  }

  // Dumplings group
  if (dumplings.length > 0) {
    const pts = DUMPLING_POINTS[Math.min(dumplings.length, 5)];
    groups.push({
      type: 'dumplings',
      cards: dumplings,
      label: `${pts} pts`,
    });
  }

  // Wasabi-nigiri pairs
  for (const pair of wasabiNigiriPairs) {
    const nigiri = pair[1];
    const basePoints = NIGIRI_VALUES[nigiri.type];
    groups.push({
      type: 'wasabi_nigiri',
      cards: pair,
      label: `${basePoints * 3} pts`,
    });
  }

  // Standalone nigiris
  if (standaloneNigiris.length > 0) {
    const totalPoints = standaloneNigiris.reduce((sum, card) => {
      return sum + (NIGIRI_VALUES[card.type] || 0);
    }, 0);
    groups.push({
      type: 'nigiri',
      cards: standaloneNigiris,
      label: `${totalPoints} pts`,
    });
  }

  // Unused wasabis
  if (unusedWasabis.length > 0) {
    groups.push({
      type: 'unused_wasabi',
      cards: unusedWasabis,
    });
  }

  // Makis (grouped together)
  if (makis.length > 0) {
    const totalMakis = countMaki(makis);
    groups.push({
      type: 'maki',
      cards: makis,
      label: `${totalMakis} maki`,
    });
  }

  // Puddings
  if (puddings.length > 0) {
    groups.push({
      type: 'pudding',
      cards: puddings,
      label: `${puddings.length} pudding`,
    });
  }

  // Chopsticks
  if (chopsticks.length > 0) {
    groups.push({
      type: 'chopsticks',
      cards: chopsticks,
    });
  }

  return groups;
}
