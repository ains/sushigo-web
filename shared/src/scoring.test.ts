import { describe, it, expect } from 'vitest';
import {
  calculateScoreBreakdown,
  scoreRoundCards,
  countMaki,
  countPuddings,
  calculateMakiBonus,
  scoreMakiForPlayers,
  calculatePuddingBonus,
  scorePuddingsForPlayers,
  DUMPLING_POINTS,
  NIGIRI_VALUES,
} from './scoring.js';
import type { Card } from './index.js';

// Helper to create cards
let cardId = 0;
function card(type: Card['type']): Card {
  return { id: `card_${cardId++}`, type };
}

function cards(...types: Card['type'][]): Card[] {
  return types.map((type) => card(type));
}

describe('Wasabi and Nigiri Scoring', () => {
  describe('basic nigiri scoring', () => {
    it('scores egg nigiri as 1 point', () => {
      expect(scoreRoundCards(cards('nigiri_egg'))).toBe(1);
    });

    it('scores salmon nigiri as 2 points', () => {
      expect(scoreRoundCards(cards('nigiri_salmon'))).toBe(2);
    });

    it('scores squid nigiri as 3 points', () => {
      expect(scoreRoundCards(cards('nigiri_squid'))).toBe(3);
    });

    it('scores multiple nigiri correctly', () => {
      expect(scoreRoundCards(cards('nigiri_egg', 'nigiri_salmon', 'nigiri_squid'))).toBe(6);
    });
  });

  describe('wasabi + nigiri combinations', () => {
    it('wasabi triples the next nigiri played', () => {
      // Wasabi then egg = 1 * 3 = 3
      expect(scoreRoundCards(cards('wasabi', 'nigiri_egg'))).toBe(3);
    });

    it('wasabi triples salmon nigiri', () => {
      // Wasabi then salmon = 2 * 3 = 6
      expect(scoreRoundCards(cards('wasabi', 'nigiri_salmon'))).toBe(6);
    });

    it('wasabi triples squid nigiri', () => {
      // Wasabi then squid = 3 * 3 = 9
      expect(scoreRoundCards(cards('wasabi', 'nigiri_squid'))).toBe(9);
    });

    it('unused wasabi scores 0', () => {
      expect(scoreRoundCards(cards('wasabi'))).toBe(0);
    });

    it('wasabi only applies to the next nigiri in play order', () => {
      // Wasabi, egg, salmon: wasabi applies to egg (3), salmon is standalone (2) = 5
      expect(scoreRoundCards(cards('wasabi', 'nigiri_egg', 'nigiri_salmon'))).toBe(5);
    });

    it('multiple wasabi apply to multiple nigiri in order', () => {
      // Wasabi, wasabi, egg, salmon: first wasabi + egg (3), second wasabi + salmon (6) = 9
      expect(scoreRoundCards(cards('wasabi', 'wasabi', 'nigiri_egg', 'nigiri_salmon'))).toBe(9);
    });

    it('nigiri before wasabi is not affected', () => {
      // Egg (1), then wasabi, then salmon (6) = 7
      expect(scoreRoundCards(cards('nigiri_egg', 'wasabi', 'nigiri_salmon'))).toBe(7);
    });

    it('extra wasabi after all nigiri scores 0', () => {
      // Egg (1), wasabi (unused) = 1
      expect(scoreRoundCards(cards('nigiri_egg', 'wasabi'))).toBe(1);
    });

    it('complex wasabi/nigiri ordering', () => {
      // squid(3), wasabi, egg(3), wasabi, salmon(6), wasabi(0) = 12
      expect(
        scoreRoundCards(
          cards(
            'nigiri_squid', // standalone: 3
            'wasabi',
            'nigiri_egg', // with wasabi: 3
            'wasabi',
            'nigiri_salmon', // with wasabi: 6
            'wasabi' // unused: 0
          )
        )
      ).toBe(12);
    });

    it('wasabi applies in strict play order, not optimally', () => {
      // wasabi, egg, squid: wasabi goes to egg (not squid) = 3 + 3 = 6
      // If it were optimal, wasabi would go to squid = 9 + 1 = 10
      expect(scoreRoundCards(cards('wasabi', 'nigiri_egg', 'nigiri_squid'))).toBe(6);
    });
  });

  describe('calculateScoreBreakdown wasabi/nigiri details', () => {
    it('shows wasabi+nigiri pairs separately', () => {
      const breakdown = calculateScoreBreakdown(cards('wasabi', 'nigiri_squid'));
      const wasabiItem = breakdown.find((item) => item.label.includes('Wasabi'));
      expect(wasabiItem).toBeDefined();
      expect(wasabiItem?.label).toBe('Wasabi + Squid');
      expect(wasabiItem?.points).toBe(9);
      expect(wasabiItem?.cards.length).toBe(2);
    });

    it('shows unused wasabi with 0 points', () => {
      const breakdown = calculateScoreBreakdown(cards('wasabi'));
      const unusedWasabi = breakdown.find((item) => item.label === 'Unused Wasabi');
      expect(unusedWasabi).toBeDefined();
      expect(unusedWasabi?.points).toBe(0);
    });

    it('shows standalone nigiri grouped together', () => {
      const breakdown = calculateScoreBreakdown(cards('nigiri_egg', 'nigiri_salmon'));
      const nigiriItem = breakdown.find((item) => item.label === 'Nigiri');
      expect(nigiriItem).toBeDefined();
      expect(nigiriItem?.points).toBe(3);
      expect(nigiriItem?.cards.length).toBe(2);
    });
  });
});

describe('Dumpling Scoring', () => {
  it('scores 0 dumplings as 0 points', () => {
    expect(scoreRoundCards([])).toBe(0);
  });

  it('scores 1 dumpling as 1 point', () => {
    expect(scoreRoundCards(cards('dumpling'))).toBe(1);
  });

  it('scores 2 dumplings as 3 points', () => {
    expect(scoreRoundCards(cards('dumpling', 'dumpling'))).toBe(3);
  });

  it('scores 3 dumplings as 6 points', () => {
    expect(scoreRoundCards(cards('dumpling', 'dumpling', 'dumpling'))).toBe(6);
  });

  it('scores 4 dumplings as 10 points', () => {
    expect(scoreRoundCards(cards('dumpling', 'dumpling', 'dumpling', 'dumpling'))).toBe(10);
  });

  it('scores 5 dumplings as 15 points', () => {
    expect(scoreRoundCards(cards('dumpling', 'dumpling', 'dumpling', 'dumpling', 'dumpling'))).toBe(
      15
    );
  });

  it('scores 6+ dumplings as 15 points (max)', () => {
    expect(
      scoreRoundCards(cards('dumpling', 'dumpling', 'dumpling', 'dumpling', 'dumpling', 'dumpling'))
    ).toBe(15);
  });

  it('DUMPLING_POINTS constant is correct', () => {
    expect(DUMPLING_POINTS).toEqual([0, 1, 3, 6, 10, 15]);
  });
});

describe('Tempura Scoring', () => {
  it('scores 1 tempura as 0 points (incomplete pair)', () => {
    expect(scoreRoundCards(cards('tempura'))).toBe(0);
  });

  it('scores 2 tempura as 5 points', () => {
    expect(scoreRoundCards(cards('tempura', 'tempura'))).toBe(5);
  });

  it('scores 3 tempura as 5 points (1 complete pair)', () => {
    expect(scoreRoundCards(cards('tempura', 'tempura', 'tempura'))).toBe(5);
  });

  it('scores 4 tempura as 10 points (2 pairs)', () => {
    expect(scoreRoundCards(cards('tempura', 'tempura', 'tempura', 'tempura'))).toBe(10);
  });
});

describe('Sashimi Scoring', () => {
  it('scores 1 sashimi as 0 points', () => {
    expect(scoreRoundCards(cards('sashimi'))).toBe(0);
  });

  it('scores 2 sashimi as 0 points (incomplete set)', () => {
    expect(scoreRoundCards(cards('sashimi', 'sashimi'))).toBe(0);
  });

  it('scores 3 sashimi as 10 points', () => {
    expect(scoreRoundCards(cards('sashimi', 'sashimi', 'sashimi'))).toBe(10);
  });

  it('scores 4 sashimi as 10 points (1 complete set)', () => {
    expect(scoreRoundCards(cards('sashimi', 'sashimi', 'sashimi', 'sashimi'))).toBe(10);
  });

  it('scores 6 sashimi as 20 points (2 sets)', () => {
    expect(
      scoreRoundCards(cards('sashimi', 'sashimi', 'sashimi', 'sashimi', 'sashimi', 'sashimi'))
    ).toBe(20);
  });
});

describe('Maki Scoring', () => {
  describe('countMaki', () => {
    it('counts maki1 as 1', () => {
      expect(countMaki(cards('maki1'))).toBe(1);
    });

    it('counts maki2 as 2', () => {
      expect(countMaki(cards('maki2'))).toBe(2);
    });

    it('counts maki3 as 3', () => {
      expect(countMaki(cards('maki3'))).toBe(3);
    });

    it('counts mixed maki correctly', () => {
      expect(countMaki(cards('maki1', 'maki2', 'maki3'))).toBe(6);
    });

    it('ignores non-maki cards', () => {
      expect(countMaki(cards('maki2', 'tempura', 'nigiri_egg'))).toBe(2);
    });
  });

  describe('calculateMakiBonus', () => {
    it('awards 6 points for most maki (single winner)', () => {
      expect(calculateMakiBonus(5, [5, 3, 2])).toBe(6);
    });

    it('awards 3 points for second most maki', () => {
      expect(calculateMakiBonus(3, [5, 3, 2])).toBe(3);
    });

    it('awards 0 points for third place', () => {
      expect(calculateMakiBonus(2, [5, 3, 2])).toBe(0);
    });

    it('awards 0 points for having no maki', () => {
      expect(calculateMakiBonus(0, [5, 3, 0])).toBe(0);
    });

    it('splits 6 points for tied first place (2 players)', () => {
      expect(calculateMakiBonus(5, [5, 5, 2])).toBe(3);
    });

    it('splits 6 points for tied first place (3 players)', () => {
      expect(calculateMakiBonus(5, [5, 5, 5])).toBe(2);
    });

    it('no second place points when first is tied', () => {
      expect(calculateMakiBonus(2, [5, 5, 2])).toBe(0);
    });

    it('splits 3 points for tied second place', () => {
      expect(calculateMakiBonus(3, [5, 3, 3])).toBe(1);
    });

    it('handles all players with 0 maki', () => {
      expect(calculateMakiBonus(0, [0, 0, 0])).toBe(0);
    });
  });

  describe('scoreMakiForPlayers', () => {
    it('returns correct scores for all players', () => {
      const players = [
        { id: 'p1', roundCards: cards('maki3', 'maki2') }, // 5 maki
        { id: 'p2', roundCards: cards('maki2', 'maki1') }, // 3 maki
        { id: 'p3', roundCards: cards('maki1') }, // 1 maki
      ];
      const scores = scoreMakiForPlayers(players);
      expect(scores.get('p1')).toBe(6); // 1st place
      expect(scores.get('p2')).toBe(3); // 2nd place
      expect(scores.has('p3')).toBe(false); // 0 points not included
    });

    it('handles tied first place', () => {
      const players = [
        { id: 'p1', roundCards: cards('maki3') }, // 3 maki
        { id: 'p2', roundCards: cards('maki3') }, // 3 maki
        { id: 'p3', roundCards: cards('maki1') }, // 1 maki
      ];
      const scores = scoreMakiForPlayers(players);
      expect(scores.get('p1')).toBe(3); // split 6
      expect(scores.get('p2')).toBe(3); // split 6
      expect(scores.has('p3')).toBe(false); // no 2nd place when 1st is tied
    });
  });
});

describe('Pudding Scoring', () => {
  describe('countPuddings', () => {
    it('counts pudding cards', () => {
      expect(countPuddings(cards('pudding', 'pudding', 'tempura'))).toBe(2);
    });
  });

  describe('calculatePuddingBonus', () => {
    it('awards +6 for most puddings (single winner)', () => {
      expect(calculatePuddingBonus(5, [5, 3, 1])).toBe(6);
    });

    it('awards -6 for least puddings (3+ players)', () => {
      expect(calculatePuddingBonus(1, [5, 3, 1])).toBe(-6);
    });

    it('no negative points in 2-player game', () => {
      expect(calculatePuddingBonus(1, [5, 1])).toBe(0);
    });

    it('most puddings in 2-player still gets +6', () => {
      expect(calculatePuddingBonus(5, [5, 1])).toBe(6);
    });

    it('splits +6 for tied most puddings', () => {
      expect(calculatePuddingBonus(5, [5, 5, 1])).toBe(3);
    });

    it('splits -6 for tied least puddings', () => {
      expect(calculatePuddingBonus(1, [5, 1, 1])).toBe(-3);
    });

    it('player with both most and least (all tied) gets +6 only', () => {
      // When everyone has the same, min === max, so no penalty
      expect(calculatePuddingBonus(3, [3, 3, 3])).toBe(2); // split +6
    });

    it('handles 4 players correctly', () => {
      expect(calculatePuddingBonus(5, [5, 3, 2, 1])).toBe(6); // most
      expect(calculatePuddingBonus(3, [5, 3, 2, 1])).toBe(0); // middle
      expect(calculatePuddingBonus(2, [5, 3, 2, 1])).toBe(0); // middle
      expect(calculatePuddingBonus(1, [5, 3, 2, 1])).toBe(-6); // least
    });

    it('handles 0 puddings as least', () => {
      expect(calculatePuddingBonus(0, [3, 2, 0])).toBe(-6);
    });

    it('player can get both +6 and -6 if tied for both (cancels out for middle ground)', () => {
      // Actually this can't happen - if you're tied for most, you can't be tied for least
      // unless everyone has the same (covered above)
    });
  });

  describe('scorePuddingsForPlayers', () => {
    it('returns correct scores for all players', () => {
      const players = [
        { id: 'p1', puddings: 5 },
        { id: 'p2', puddings: 3 },
        { id: 'p3', puddings: 1 },
      ];
      const scores = scorePuddingsForPlayers(players);
      expect(scores.get('p1')).toBe(6); // most
      expect(scores.has('p2')).toBe(false); // middle, 0 points
      expect(scores.get('p3')).toBe(-6); // least
    });

    it('handles 2-player game (no negative)', () => {
      const players = [
        { id: 'p1', puddings: 5 },
        { id: 'p2', puddings: 1 },
      ];
      const scores = scorePuddingsForPlayers(players);
      expect(scores.get('p1')).toBe(6);
      expect(scores.has('p2')).toBe(false); // no penalty in 2-player
    });

    it('handles ties correctly', () => {
      const players = [
        { id: 'p1', puddings: 4 },
        { id: 'p2', puddings: 4 },
        { id: 'p3', puddings: 1 },
        { id: 'p4', puddings: 1 },
      ];
      const scores = scorePuddingsForPlayers(players);
      expect(scores.get('p1')).toBe(3); // split +6
      expect(scores.get('p2')).toBe(3); // split +6
      expect(scores.get('p3')).toBe(-3); // split -6
      expect(scores.get('p4')).toBe(-3); // split -6
    });
  });
});

describe('Combined Scoring', () => {
  it('scores a realistic round correctly', () => {
    // 2 tempura (5) + 3 dumplings (6) + wasabi+squid (9) + salmon (2) = 22
    const roundCards = cards(
      'tempura',
      'tempura',
      'dumpling',
      'dumpling',
      'dumpling',
      'wasabi',
      'nigiri_squid',
      'nigiri_salmon'
    );
    expect(scoreRoundCards(roundCards)).toBe(22);
  });

  it('maki and pudding do not affect round score', () => {
    // Maki and pudding are scored separately
    const roundCards = cards('maki3', 'maki2', 'pudding', 'pudding');
    expect(scoreRoundCards(roundCards)).toBe(0);
  });

  it('chopsticks do not affect score', () => {
    const roundCards = cards('chopsticks', 'nigiri_egg');
    expect(scoreRoundCards(roundCards)).toBe(1);
  });
});

describe('NIGIRI_VALUES constant', () => {
  it('has correct values', () => {
    expect(NIGIRI_VALUES['nigiri_egg']).toBe(1);
    expect(NIGIRI_VALUES['nigiri_salmon']).toBe(2);
    expect(NIGIRI_VALUES['nigiri_squid']).toBe(3);
  });
});
