import { PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import { scoreRoundCards } from 'sushigo-shared';
import { groupPlayedCards, CardGroup } from '../../utils/cardGrouping';
import './GameBoard.css';

interface GameBoardProps {
  players: PublicPlayer[];
  currentRound: number;
}

interface PlayerBoardProps {
  player: PublicPlayer;
  currentRound: number;
}

function CardGroupDisplay({ group }: { group: CardGroup }) {
  const isIncomplete = group.type === 'incomplete_tempura' || group.type === 'incomplete_sashimi';
  const isUnused = group.type === 'unused_wasabi';

  return (
    <div
      className={`card-group card-group-${group.type} ${isIncomplete ? 'incomplete' : ''} ${isUnused ? 'unused' : ''}`}
    >
      <div className="card-group-cards">
        {group.cards.map((card) => (
          <Card key={card.id} card={card} size="small" showPoints={false} />
        ))}
      </div>
      {group.label && <div className="card-group-label">{group.label}</div>}
    </div>
  );
}

function PlayerBoard({ player, currentRound }: PlayerBoardProps) {
  const roundCards = player.playedCards[currentRound - 1] || [];
  const roundPoints = scoreRoundCards(roundCards);
  const cardGroups = groupPlayedCards(roundCards);

  return (
    <div className="player-board">
      <div className="player-header">
        <span className="player-name">{player.name}</span>
        <div className="player-status">
          <span className="round-points">{roundPoints} pts</span>
          <span className={`player-ready ${player.hasConfirmed ? 'confirmed' : ''}`}>
            {player.hasConfirmed ? '✓ Ready' : `${player.handSize} cards`}
          </span>
        </div>
      </div>
      <div className="played-cards">
        {cardGroups.map((group, index) => (
          <CardGroupDisplay key={`${group.type}-${index}`} group={group} />
        ))}
        {cardGroups.length === 0 && <div className="no-cards">No cards played yet</div>}
      </div>
    </div>
  );
}

export function GameBoard({ players, currentRound }: GameBoardProps) {
  // Split players into two sides of the table based on their seatIndex
  // Seats 0, 1 = bottom side (near side) - normal orientation
  // Seats 2, 3 = top side (far side) - rotated 180° for players sitting opposite

  // Get player at each seat position
  const getPlayerAtSeat = (seatIndex: number): PublicPlayer | undefined => {
    return players.find((p) => p.seatIndex === seatIndex);
  };

  // Top players (seats 2 and 3)
  const topPlayers = [getPlayerAtSeat(2), getPlayerAtSeat(3)].filter(Boolean) as PublicPlayer[];
  // Bottom players (seats 0 and 1)
  const bottomPlayers = [getPlayerAtSeat(0), getPlayerAtSeat(1)].filter(Boolean) as PublicPlayer[];

  return (
    <div className="game-board">
      {/* Top side - rotated 180° for opposing players */}
      <div className="table-side top-side">
        {topPlayers.map((player) => (
          <PlayerBoard key={player.id} player={player} currentRound={currentRound} />
        ))}
      </div>

      {/* Center divider */}
      <div className="table-divider" />

      {/* Bottom side - normal orientation */}
      <div className="table-side bottom-side">
        {bottomPlayers.map((player) => (
          <PlayerBoard key={player.id} player={player} currentRound={currentRound} />
        ))}
      </div>
    </div>
  );
}
