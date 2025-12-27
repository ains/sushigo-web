import { Card, CardType, DECK_CONFIG } from '../types/index.js';

export class Deck {
  private cards: Card[] = [];
  private nextId = 1;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.cards = [];
    this.nextId = 1;

    // Create cards based on deck configuration
    for (const [cardType, count] of Object.entries(DECK_CONFIG)) {
      for (let i = 0; i < count; i++) {
        this.cards.push({
          id: `card_${this.nextId++}`,
          type: cardType as CardType,
        });
      }
    }
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} remaining`);
    }
    return this.cards.splice(0, count);
  }

  reset(): void {
    this.initialize();
    this.shuffle();
  }

  get remaining(): number {
    return this.cards.length;
  }
}
