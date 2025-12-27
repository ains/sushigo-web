import { Card as CardType, PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import { RoundScore } from '../../context/GameContext';
import './RoundScoreBreakdown.css';

interface ScoreItem {
  label: string;
  cards: CardType[];
  points: number;
  description?: string;
}

interface RoundScoreBreakdownProps {
  player: PublicPlayer;
  roundScore: RoundScore | undefined;
  currentRound: number;
}

function calculateScoreBreakdown(cards: CardType[]): ScoreItem[] {
  const items: ScoreItem[] = [];

  // Separate cards by type
  const tempuras = cards.filter(c => c.type === 'tempura');
  const sashimis = cards.filter(c => c.type === 'sashimi');
  const dumplings = cards.filter(c => c.type === 'dumpling');
  const makis = cards.filter(c => c.type.startsWith('maki'));
  const puddings = cards.filter(c => c.type === 'pudding');
  const chopsticks = cards.filter(c => c.type === 'chopsticks');

  // Process nigiri and wasabi in order
  const wasabiNigiriPairs: { wasabi: CardType; nigiri: CardType }[] = [];
  const standaloneNigiris: CardType[] = [];
  const unusedWasabis: CardType[] = [];
  let pendingWasabis: CardType[] = [];

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
        : 'Need 2 for 5 pts',
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
        : 'Need 3 for 10 pts',
    });
  }

  // Dumplings: 1/3/6/10/15
  if (dumplings.length > 0) {
    const dumplingPoints = [0, 1, 3, 6, 10, 15];
    const points = dumplingPoints[Math.min(dumplings.length, 5)];
    items.push({
      label: 'Dumplings',
      cards: dumplings,
      points,
      description: `${dumplings.length} dumpling${dumplings.length > 1 ? 's' : ''} = ${points} pts`,
    });
  }

  // Wasabi + Nigiri combos
  for (const { wasabi, nigiri } of wasabiNigiriPairs) {
    const basePoints = nigiri.type === 'nigiri_egg' ? 1 : nigiri.type === 'nigiri_salmon' ? 2 : 3;
    const points = basePoints * 3;
    const nigiriName = nigiri.type === 'nigiri_egg' ? 'Egg' : nigiri.type === 'nigiri_salmon' ? 'Salmon' : 'Squid';
    items.push({
      label: `Wasabi + ${nigiriName}`,
      cards: [wasabi, nigiri],
      points,
      description: `${basePoints} x 3 = ${points} pts`,
    });
  }

  // Standalone nigiris
  if (standaloneNigiris.length > 0) {
    const points = standaloneNigiris.reduce((sum, card) => {
      if (card.type === 'nigiri_egg') return sum + 1;
      if (card.type === 'nigiri_salmon') return sum + 2;
      if (card.type === 'nigiri_squid') return sum + 3;
      return sum;
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

  // Maki (comparative scoring - show count only)
  if (makis.length > 0) {
    const totalMaki = makis.reduce((sum, card) => {
      if (card.type === 'maki1') return sum + 1;
      if (card.type === 'maki2') return sum + 2;
      if (card.type === 'maki3') return sum + 3;
      return sum;
    }, 0);
    items.push({
      label: 'Maki Rolls',
      cards: makis,
      points: 0,
      description: `${totalMaki} maki (scored vs others)`,
    });
  }

  // Pudding (end-game scoring)
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

export function RoundScoreBreakdown({ player, roundScore, currentRound }: RoundScoreBreakdownProps) {
  const roundCards = player.playedCards[currentRound - 1] || [];
  const scoreItems = calculateScoreBreakdown(roundCards);
  const calculatedPoints = scoreItems.reduce((sum, item) => sum + item.points, 0);

  // Use roundScore if available, otherwise use calculated points
  const displayRoundScore = roundScore?.roundScore ?? calculatedPoints;
  const previousScore = (roundScore?.totalScore ?? player.score) - displayRoundScore;

  return (
    <div className="round-score-breakdown">
      <h2>Round {currentRound} Complete!</h2>

      <div className="score-items">
        {scoreItems.map((item, index) => (
          <div key={index} className={`score-item ${item.points === 0 ? 'no-points' : ''}`}>
            <div className="score-item-header">
              <span className="score-item-label">{item.label}</span>
              <span className="score-item-points">
                {item.points > 0 ? `+${item.points}` : item.points === 0 ? '-' : item.points}
              </span>
            </div>
            <div className="score-item-cards">
              {item.cards.map(card => (
                <Card key={card.id} card={card} size="small" showPoints={false} />
              ))}
            </div>
            {item.description && (
              <div className="score-item-description">{item.description}</div>
            )}
          </div>
        ))}
      </div>

      {scoreItems.length === 0 && (
        <div className="no-cards-message">No cards played this round</div>
      )}

      <div className="score-summary">
        <div className="score-row">
          <span>Previous Score</span>
          <span>{previousScore}</span>
        </div>
        <div className="score-row round-score">
          <span>Round {currentRound} Points</span>
          <span>+{displayRoundScore}</span>
        </div>
        <div className="score-row total-score">
          <span>Total Score</span>
          <span>{roundScore?.totalScore ?? player.score}</span>
        </div>
      </div>

      <p className="waiting-text">Next round starting soon...</p>
    </div>
  );
}
