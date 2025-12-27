import { useGame } from '../../context/GameContext';
import { TVGameBoard } from '../tv/TVGameBoard';
import { PlayerHand } from '../mobile/PlayerHand';
import './RemoteView.css';

export function RemoteGamePlay() {
  const { gameState, myPlayerId } = useGame();

  if (!gameState) return null;

  const players = gameState.players;
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hasConfirmed = myPlayer?.hasConfirmed ?? false;

  // Count how many players have confirmed
  const confirmedCount = players.filter((p) => p.hasConfirmed).length;
  const totalPlayers = players.length;

  return (
    <div className="remote-gameplay">
      {/* Game board section */}
      <div className="board-section">
        <TVGameBoard
          players={players}
          currentRound={gameState.currentRound}
          currentTurn={gameState.currentTurn}
          phase={gameState.phase}
        />
      </div>

      {/* Divider */}
      <div className="hand-divider">
        <span>Your Hand</span>
      </div>

      {/* Hand section */}
      <div className="hand-section">
        {hasConfirmed ? (
          <div className="waiting-overlay">
            <div className="waiting-content">
              <div className="spinner"></div>
              <p>Waiting for other players...</p>
              <p className="waiting-count">
                {confirmedCount} / {totalPlayers} ready
              </p>
            </div>
          </div>
        ) : (
          <PlayerHand compact />
        )}
      </div>
    </div>
  );
}
