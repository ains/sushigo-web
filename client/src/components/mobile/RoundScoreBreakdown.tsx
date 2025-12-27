import { PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import { countMaki, calculateScoreBreakdown, calculateMakiBonus } from 'sushigo-shared';
import './RoundScoreBreakdown.css';

interface RoundScoreBreakdownProps {
  player: PublicPlayer;
  allPlayers: PublicPlayer[];
  currentRound: number;
}

interface MakiRanking {
  playerId: string;
  playerName: string;
  makiCount: number;
  points: number;
}

function calculateMakiRankings(players: PublicPlayer[], roundIndex: number): MakiRanking[] {
  const allMakiCounts = players.map((p) => countMaki(p.playedCards[roundIndex] || []));

  return players.map((p, i) => ({
    playerId: p.id,
    playerName: p.name,
    makiCount: allMakiCounts[i],
    points: calculateMakiBonus(allMakiCounts[i], allMakiCounts),
  }));
}

function MakiDescription({
  myMakiCount,
  makiRankings,
  myPlayerId,
}: {
  myMakiCount: number;
  makiRankings: MakiRanking[];
  myPlayerId: string;
}) {
  const winners = makiRankings.filter((r) => r.points > 0).sort((a, b) => b.points - a.points);

  if (winners.length === 0) {
    return <div className="score-item-description">No one scored maki points this round.</div>;
  }

  return (
    <div className="score-item-description maki-description">
      <p>
        You had <strong>{myMakiCount}</strong> maki{myMakiCount !== 1 ? '' : ''} this round.
      </p>
      {winners.map((winner) => {
        const isMe = winner.playerId === myPlayerId;
        const name = isMe ? 'You' : winner.playerName;
        return (
          <p key={winner.playerId} className={isMe ? 'maki-winner-me' : ''}>
            <strong>+{winner.points} pts</strong> to {name} ({winner.makiCount} maki)
          </p>
        );
      })}
    </div>
  );
}

export function RoundScoreBreakdown({
  player,
  allPlayers,
  currentRound,
}: RoundScoreBreakdownProps) {
  const roundCards = player.playedCards[currentRound - 1] || [];
  const scoreItems = calculateScoreBreakdown(roundCards);
  const makiRankings = calculateMakiRankings(allPlayers, currentRound - 1);
  const myMakiRanking = makiRankings.find((r) => r.playerId === player.id);
  const myMakiCount = myMakiRanking?.makiCount || 0;
  const myMakiPoints = myMakiRanking?.points || 0;

  const roundPoints = scoreItems.reduce((sum, item) => sum + item.points, 0) + myMakiPoints; // Include maki points in total

  const previousScore = player.score - roundPoints;

  return (
    <div className="round-score-breakdown">
      <h2>Round {currentRound} Complete!</h2>

      <div className="score-items">
        {scoreItems.map((item, index) => {
          const isMaki = item.label === 'Maki Rolls';
          const displayPoints = isMaki ? myMakiPoints : item.points;
          const hasPoints = displayPoints > 0;

          return (
            <div key={index} className={`score-item ${!hasPoints ? 'no-points' : ''}`}>
              <div className="score-item-content">
                <span className="score-item-label">{item.label}</span>
                <div className="score-item-cards">
                  {item.cards.map((card) => (
                    <Card key={card.id} card={card} size="small" showPoints={false} />
                  ))}
                </div>
                {isMaki ? (
                  <MakiDescription
                    myMakiCount={myMakiCount}
                    makiRankings={makiRankings}
                    myPlayerId={player.id}
                  />
                ) : (
                  item.description && (
                    <div className="score-item-description">{item.description}</div>
                  )
                )}
              </div>
              <span className="score-item-points">{displayPoints}</span>
            </div>
          );
        })}
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
          <span>+{roundPoints}</span>
        </div>
        <div className="score-row total-score">
          <span>Total Score</span>
          <span>{player.score}</span>
        </div>
      </div>

      <p className="waiting-text">Next round starting soon...</p>
    </div>
  );
}
