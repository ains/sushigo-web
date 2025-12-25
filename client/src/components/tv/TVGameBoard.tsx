import { PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import { calculateRoundPoints } from '../../utils/scoring';
import { groupPlayedCards, CardGroup } from '../../utils/cardGrouping';
import './TVGameBoard.css';

interface TVGameBoardProps {
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
    <div className={`card-group card-group-${group.type} ${isIncomplete ? 'incomplete' : ''} ${isUnused ? 'unused' : ''}`}>
      <div className="card-group-cards">
        {group.cards.map(card => (
          <Card key={card.id} card={card} size="small" showPoints={false} />
        ))}
      </div>
      {group.label && <div className="card-group-label">{group.label}</div>}
    </div>
  );
}

function PlayerBoard({ player, currentRound }: PlayerBoardProps) {
  const roundCards = player.playedCards[currentRound - 1] || [];
  const roundPoints = calculateRoundPoints(roundCards);
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
        {cardGroups.length === 0 && (
          <div className="no-cards">No cards played yet</div>
        )}
      </div>
    </div>
  );
}

export function TVGameBoard({ players, currentRound }: TVGameBoardProps) {
  // Display all players in a grid without rotation
  // Sort by seat index for consistent ordering
  const sortedPlayers = [...players].sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0));

  return (
    <div className="tv-game-board">
      {sortedPlayers.map(player => (
        <PlayerBoard key={player.id} player={player} currentRound={currentRound} />
      ))}
    </div>
  );
}
