import { scoreRoundCards, countMaki } from 'sushigo-shared';
import { PublicPlayer } from "../../types";

function calculateMakiBonus(
  playerMaki: number,
  allPlayerMakis: number[]
): number {
  const sorted = [...allPlayerMakis].sort((a, b) => b - a);
  const highest = sorted[0];
  const secondHighest = sorted.find((m) => m < highest) ?? 0;

  if (playerMaki === 0) return 0;

  const firstPlaceCount = allPlayerMakis.filter((m) => m === highest).length;

  if (playerMaki === highest) {
    if (firstPlaceCount > 1) {
      return Math.floor(6 / firstPlaceCount);
    }
    return 6;
  }

  if (playerMaki === secondHighest && firstPlaceCount === 1) {
    const secondPlaceCount = allPlayerMakis.filter(
      (m) => m === secondHighest
    ).length;
    if (secondPlaceCount > 1) {
      return Math.floor(3 / secondPlaceCount);
    }
    return 3;
  }

  return 0;
}

function calculatePuddingBonus(
  playerPuddings: number,
  allPlayerPuddings: number[]
): number {
  const sorted = [...allPlayerPuddings].sort((a, b) => b - a);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  let bonus = 0;

  if (playerPuddings === highest) {
    const tiedCount = allPlayerPuddings.filter((p) => p === highest).length;
    bonus += Math.floor(6 / tiedCount);
  }

  if (
    allPlayerPuddings.length > 2 &&
    playerPuddings === lowest &&
    lowest < highest
  ) {
    const tiedCount = allPlayerPuddings.filter((p) => p === lowest).length;
    bonus -= Math.floor(6 / tiedCount);
  }

  return bonus;
}

interface PlayerScoreBreakdown {
  player: PublicPlayer;
  roundScores: number[];
  puddingBonus: number;
  totalScore: number;
}

function calculateLeaderboard(players: PublicPlayer[]): PlayerScoreBreakdown[] {
  const allPuddings = players.map((p) => p.puddings);

  const breakdowns = players.map((player) => {
    const roundScores = player.playedCards.map((cards, roundIndex) => {
      const basePoints = scoreRoundCards(cards);
      const allMakis = players.map((p) =>
        countMaki(p.playedCards[roundIndex] || [])
      );
      const myMaki = countMaki(cards);
      const makiBonus = calculateMakiBonus(myMaki, allMakis);
      return basePoints + makiBonus;
    });

    const puddingBonus = calculatePuddingBonus(player.puddings, allPuddings);
    const totalScore =
      roundScores.reduce((sum, s) => sum + s, 0) + puddingBonus;

    return { player, roundScores, puddingBonus, totalScore };
  });

  return breakdowns.sort((a, b) => b.totalScore - a.totalScore);
}

interface TVGameEndProps {
  players: PublicPlayer[];
  onPlayAgain?: () => void;
}

export function TVGameEnd({ players, onPlayAgain }: TVGameEndProps) {
  const leaderboard = calculateLeaderboard(players);
  const winner = leaderboard[0]?.player;
  const numRounds = leaderboard[0]?.roundScores.length || 3;

  return (
    <div className="tv-view game-end">
      <div className="winner-announcement">
        <span className="winner-emoji">🏆</span>
        <h1>{winner?.name || "Unknown"} Wins!</h1>
      </div>
      <div className="leaderboard">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name">Player</th>
              {Array.from({ length: numRounds }, (_, i) => (
                <th key={i} className="col-round">
                  R{i + 1}
                </th>
              ))}
              <th className="col-pudding">🍮</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.player.id}
                className={index === 0 ? "winner" : ""}
              >
                <td className="col-rank">{index + 1}</td>
                <td className="col-name">{entry.player.name}</td>
                {entry.roundScores.map((score, i) => (
                  <td key={i} className="col-round">
                    {score}
                  </td>
                ))}
                <td
                  className={`col-pudding ${
                    entry.puddingBonus > 0
                      ? "positive"
                      : entry.puddingBonus < 0
                      ? "negative"
                      : ""
                  }`}
                >
                  {entry.puddingBonus > 0 ? "+" : ""}
                  {entry.puddingBonus}
                </td>
                <td className="col-total">{entry.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPlayAgain && (
        <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Play Again
        </button>
      )}
    </div>
  );
}
