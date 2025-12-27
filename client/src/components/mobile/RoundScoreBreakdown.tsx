import { Card as CardType, PublicPlayer } from "../../types";
import { Card } from "../shared/Card";
import { countMaki, DUMPLING_POINTS, NIGIRI_VALUES } from "sushigo-shared";
import "./RoundScoreBreakdown.css";

interface ScoreItem {
  label: string;
  cards: CardType[];
  points: number;
  description?: string;
}

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

function calculateMakiRankings(
  players: PublicPlayer[],
  roundIndex: number
): MakiRanking[] {
  const playerMakis = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    makiCount: countMaki(p.playedCards[roundIndex] || []),
    points: 0,
  }));

  // Sort by maki count descending
  const sorted = [...playerMakis].sort((a, b) => b.makiCount - a.makiCount);

  if (sorted.length === 0 || sorted[0].makiCount === 0) {
    return playerMakis;
  }

  const highest = sorted[0].makiCount;
  const firstPlacePlayers = sorted.filter((p) => p.makiCount === highest);

  // Award 6 points split among first place
  const firstPlacePoints = Math.floor(6 / firstPlacePlayers.length);
  firstPlacePlayers.forEach((p) => {
    const player = playerMakis.find((pm) => pm.playerId === p.playerId);
    if (player) player.points = firstPlacePoints;
  });

  // If there's only one first place winner, award second place
  if (firstPlacePlayers.length === 1) {
    const remaining = sorted.filter(
      (p) => p.makiCount < highest && p.makiCount > 0
    );
    if (remaining.length > 0) {
      const secondHighest = remaining[0].makiCount;
      const secondPlacePlayers = remaining.filter(
        (p) => p.makiCount === secondHighest
      );
      const secondPlacePoints = Math.floor(3 / secondPlacePlayers.length);
      secondPlacePlayers.forEach((p) => {
        const player = playerMakis.find((pm) => pm.playerId === p.playerId);
        if (player) player.points = secondPlacePoints;
      });
    }
  }

  return playerMakis;
}

function calculateScoreBreakdown(cards: CardType[]): ScoreItem[] {
  const items: ScoreItem[] = [];

  // Separate cards by type
  const tempuras = cards.filter((c) => c.type === "tempura");
  const sashimis = cards.filter((c) => c.type === "sashimi");
  const dumplings = cards.filter((c) => c.type === "dumpling");
  const makis = cards.filter((c) => c.type.startsWith("maki"));
  const puddings = cards.filter((c) => c.type === "pudding");
  const chopsticks = cards.filter((c) => c.type === "chopsticks");

  // Process nigiri and wasabi in order
  const wasabiNigiriPairs: { wasabi: CardType; nigiri: CardType }[] = [];
  const standaloneNigiris: CardType[] = [];
  const unusedWasabis: CardType[] = [];
  let pendingWasabis: CardType[] = [];

  for (const card of cards) {
    if (card.type === "wasabi") {
      pendingWasabis.push(card);
    } else if (card.type.startsWith("nigiri_")) {
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
      label: "Tempura",
      cards: tempuras,
      points,
      description:
        pairs > 0
          ? `${pairs} pair${pairs > 1 ? "s" : ""} = ${points} pts`
          : "2 needed for 5 pts",
    });
  }

  // Sashimi: 10 pts per set of 3
  if (sashimis.length > 0) {
    const sets = Math.floor(sashimis.length / 3);
    const points = sets * 10;
    items.push({
      label: "Sashimi",
      cards: sashimis,
      points,
      description:
        sets > 0
          ? `${sets} set${sets > 1 ? "s" : ""} = ${points} pts`
          : "3 needed for 10 pts",
    });
  }

  // Dumplings: 1/3/6/10/15
  if (dumplings.length > 0) {
    const points = DUMPLING_POINTS[Math.min(dumplings.length, 5)];
    items.push({
      label: "Dumplings",
      cards: dumplings,
      points,
      description: `${dumplings.length} dumpling${
        dumplings.length > 1 ? "s" : ""
      } = ${points} pts`,
    });
  }

  // Wasabi + Nigiri combos
  for (const { wasabi, nigiri } of wasabiNigiriPairs) {
    const basePoints = NIGIRI_VALUES[nigiri.type];
    const points = basePoints * 3;
    const nigiriName =
      nigiri.type === "nigiri_egg"
        ? "Egg"
        : nigiri.type === "nigiri_salmon"
        ? "Salmon"
        : "Squid";
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
      return sum + (NIGIRI_VALUES[card.type] || 0);
    }, 0);
    items.push({
      label: "Nigiri",
      cards: standaloneNigiris,
      points,
    });
  }

  // Unused wasabi
  if (unusedWasabis.length > 0) {
    items.push({
      label: "Unused Wasabi",
      cards: unusedWasabis,
      points: 0,
      description: "No nigiri to enhance",
    });
  }

  // Maki - handled separately with rankings, but still include cards
  if (makis.length > 0) {
    items.push({
      label: "Maki Rolls",
      cards: makis,
      points: 0, // Points calculated separately with rankings
    });
  }

  // Pudding (end-game scoring)
  if (puddings.length > 0) {
    items.push({
      label: "Pudding",
      cards: puddings,
      points: 0,
      description: `${puddings.length} saved for end`,
    });
  }

  // Chopsticks
  if (chopsticks.length > 0) {
    items.push({
      label: "Chopsticks",
      cards: chopsticks,
      points: 0,
      description: "Not used",
    });
  }

  return items;
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
  const winners = makiRankings
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points);

  if (winners.length === 0) {
    return (
      <div className="score-item-description">
        No one scored maki points this round.
      </div>
    );
  }

  return (
    <div className="score-item-description maki-description">
      <p>
        You had <strong>{myMakiCount}</strong> maki{myMakiCount !== 1 ? "" : ""}{" "}
        this round.
      </p>
      {winners.map((winner) => {
        const isMe = winner.playerId === myPlayerId;
        const name = isMe ? "You" : winner.playerName;
        return (
          <p key={winner.playerId} className={isMe ? "maki-winner-me" : ""}>
            <strong>+{winner.points} pts</strong> to {name} ({winner.makiCount}{" "}
            maki)
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

  const roundPoints = scoreItems.reduce(
    (sum, item) => sum + item.points,
    0
  ) + myMakiPoints; // Include maki points in total

  const previousScore = player.score - roundPoints;

  return (
    <div className="round-score-breakdown">
      <h2>Round {currentRound} Complete!</h2>

      <div className="score-items">
        {scoreItems.map((item, index) => {
          const isMaki = item.label === "Maki Rolls";
          const displayPoints = isMaki ? myMakiPoints : item.points;
          const hasPoints = displayPoints > 0;

          return (
            <div
              key={index}
              className={`score-item ${!hasPoints ? "no-points" : ""}`}
            >
              <div className="score-item-content">
                <span className="score-item-label">{item.label}</span>
                <div className="score-item-cards">
                  {item.cards.map((card) => (
                    <Card
                      key={card.id}
                      card={card}
                      size="small"
                      showPoints={false}
                    />
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
                    <div className="score-item-description">
                      {item.description}
                    </div>
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
