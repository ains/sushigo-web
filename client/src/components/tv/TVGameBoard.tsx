import { PublicPlayer } from '../../types';
import { Card } from '../shared/Card';
import { scoreRoundCards } from 'sushigo-shared';
import { groupPlayedCards, CardGroup } from '../../utils/cardGrouping';
import './TVGameBoard.css';

interface TVGameBoardProps {
  players: PublicPlayer[];
  currentRound: number;
  currentTurn: number;
  phase: string;
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

export function TVGameBoard({ players, currentRound, currentTurn, phase }: TVGameBoardProps) {
  // Display all players in a grid without rotation
  // Sort by seat index for consistent ordering
  const sortedPlayers = [...players].sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0));
  // Sort by score for the scoreboard (highest first)
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="tv-board-container">
      <div className="tv-scoreboard">
        <div className="scoreboard-info">
          <span className="scoreboard-round">Round {currentRound}/3</span>
          {phase === 'playing' && <span className="scoreboard-turn">Turn {currentTurn}</span>}
          {phase === 'round_end' && <span className="scoreboard-phase">Round Complete</span>}
        </div>
        <div className="scoreboard-players">
          {rankedPlayers.map((player, index) => (
            <div key={player.id} className={`scoreboard-player ${index === 0 ? 'leading' : ''}`}>
              <span className="scoreboard-name">{player.name}</span>
              <span className="scoreboard-score">{player.score}</span>
              <span className="scoreboard-puddings">🍮 {player.puddings}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tv-game-board">
        {sortedPlayers.map((player) => (
          <PlayerBoard key={player.id} player={player} currentRound={currentRound} />
        ))}
      </div>
    </div>
  );
}
