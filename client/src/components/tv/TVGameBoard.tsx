import { PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import './TVGameBoard.css';

interface TVGameBoardProps {
  players: PublicPlayer[];
  currentRound: number;
}

interface PlayerBoardProps {
  player: PublicPlayer;
  currentRound: number;
}

function PlayerBoard({ player, currentRound }: PlayerBoardProps) {
  return (
    <div className="player-board">
      <div className="player-header">
        <span className="player-name">{player.name}</span>
        <span className={`player-ready ${player.hasConfirmed ? 'confirmed' : ''}`}>
          {player.hasConfirmed ? '✓ Ready' : `${player.handSize} cards`}
        </span>
      </div>
      <div className="played-cards">
        {player.playedCards[currentRound - 1]?.map(card => (
          <Card key={card.id} card={card} size="small" showPoints={false} />
        ))}
        {(!player.playedCards[currentRound - 1] || player.playedCards[currentRound - 1].length === 0) && (
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
