import { PublicPlayer } from '../../types';
import { scoreRoundCards, countMaki } from 'sushigo-shared';
import './GameScoreBreakdown.css';

interface GameScoreBreakdownProps {
  player: PublicPlayer;
  allPlayers: PublicPlayer[];
  isWinner: boolean;
  rank: number;
}

function calculateMakiBonus(playerMaki: number, allPlayerMakis: number[]): number {
  const sorted = [...allPlayerMakis].sort((a, b) => b - a);
  const highest = sorted[0];
  const secondHighest = sorted.find(m => m < highest) ?? 0;

  if (playerMaki === 0) return 0;

  // Count ties for first place
  const firstPlaceCount = allPlayerMakis.filter(m => m === highest).length;

  if (playerMaki === highest) {
    if (firstPlaceCount > 1) {
      // Split 6 points among tied players
      return Math.floor(6 / firstPlaceCount);
    }
    return 6;
  }

  if (playerMaki === secondHighest && firstPlaceCount === 1) {
    // Count ties for second place
    const secondPlaceCount = allPlayerMakis.filter(m => m === secondHighest).length;
    if (secondPlaceCount > 1) {
      // Split 3 points among tied players
      return Math.floor(3 / secondPlaceCount);
    }
    return 3;
  }

  return 0;
}

function calculatePuddingBonus(playerPuddings: number, allPlayerPuddings: number[]): number {
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

export function GameScoreBreakdown({
  player,
  allPlayers,
  isWinner,
  rank,
}: GameScoreBreakdownProps) {
  // Calculate round-by-round scores
  const roundScores = player.playedCards.map((cards, index) => {
    const points = scoreRoundCards(cards);
    return { round: index + 1, points };
  });

  // Calculate total maki per player for each round and sum up bonuses
  const makiBonusPerRound = player.playedCards.map((_, roundIndex) => {
    const allMakis = allPlayers.map(p => countMaki(p.playedCards[roundIndex] || []));
    const myMaki = countMaki(player.playedCards[roundIndex] || []);
    return calculateMakiBonus(myMaki, allMakis);
  });

  const totalMakiBonus = makiBonusPerRound.reduce((sum, bonus) => sum + bonus, 0);
  const totalRoundPoints = roundScores.reduce((sum, r) => sum + r.points, 0);

  // Calculate pudding bonus
  const allPuddings = allPlayers.map(p => p.puddings);
  const puddingBonus = calculatePuddingBonus(player.puddings, allPuddings);

  const calculatedTotal = totalRoundPoints + totalMakiBonus + puddingBonus;

  return (
    <div className="game-score-breakdown">
      <div className={`result-banner ${isWinner ? 'winner' : ''}`}>
        {isWinner ? (
          <>
            <span className="emoji">🏆</span>
            <h1>You Win!</h1>
          </>
        ) : (
          <>
            <span className="emoji">{rank === 2 ? '🥈' : rank === 3 ? '🥉' : '😢'}</span>
            <h1>#{rank} Place</h1>
          </>
        )}
      </div>

      <div className="breakdown-section">
        <h3>Round Scores</h3>
        {roundScores.map((round, index) => (
          <div key={round.round} className="breakdown-row">
            <span className="breakdown-label">Round {round.round}</span>
            <span className="breakdown-value">
              {round.points + makiBonusPerRound[index]}
            </span>
          </div>
        ))}
        <div className="breakdown-row subtotal">
          <span className="breakdown-label">Subtotal</span>
          <span className="breakdown-value">{totalRoundPoints + totalMakiBonus}</span>
        </div>
      </div>

      <div className="breakdown-section">
        <h3>End Game Bonuses</h3>
        <div className="breakdown-row">
          <span className="breakdown-label">
            🍮 Puddings ({player.puddings})
          </span>
          <span className={`breakdown-value ${puddingBonus > 0 ? 'positive' : puddingBonus < 0 ? 'negative' : ''}`}>
            {puddingBonus > 0 ? '+' : ''}{puddingBonus}
          </span>
        </div>
      </div>

      <div className="breakdown-section total-section">
        <div className="breakdown-row total">
          <span className="breakdown-label">Final Score</span>
          <span className="breakdown-value">{calculatedTotal}</span>
        </div>
      </div>

      <p className="waiting-text">Waiting for host to restart...</p>
    </div>
  );
}
