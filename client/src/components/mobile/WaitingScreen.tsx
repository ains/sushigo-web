import { PublicGameState } from '../../types';
import './WaitingScreen.css';

interface WaitingScreenProps {
  gameState: PublicGameState;
}

export function WaitingScreen({ gameState }: WaitingScreenProps) {
  const confirmedCount = gameState.players.filter(p => p.hasConfirmed).length;
  const totalPlayers = gameState.players.length;

  return (
    <div className="waiting-screen">
      <div className="waiting-icon">✓</div>
      <h1>Card Selected!</h1>
      <p className="waiting-text">Waiting for other players...</p>

      <div className="player-status-list">
        {gameState.players.map(player => (
          <div
            key={player.id}
            className={`player-status-item ${player.hasConfirmed ? 'ready' : 'waiting'}`}
          >
            <span className="status-icon">
              {player.hasConfirmed ? '✓' : '...'}
            </span>
            <span className="player-name">{player.name}</span>
          </div>
        ))}
      </div>

      <div className="progress-indicator">
        <div className="progress-text">
          {confirmedCount} / {totalPlayers} ready
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(confirmedCount / totalPlayers) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
