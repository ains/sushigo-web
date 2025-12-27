import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { TVGameBoard } from '../tv/TVGameBoard';
import { TVGameEnd } from '../tv/TVGameEnd';
import './SpectatorView.css';

export function SpectatorView() {
  const { code } = useParams<{ code: string }>();
  const { gameState, spectateGame, isConnected, error, finalScores, winner } = useGame();

  useEffect(() => {
    if (isConnected && code && !gameState) {
      spectateGame(code);
    }
  }, [isConnected, code, gameState, spectateGame]);

  // Error state
  if (error) {
    return (
      <div className="spectator-view error">
        <div className="error-icon">!</div>
        <h1>Unable to Join</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Connecting/loading state
  if (!gameState) {
    return (
      <div className="spectator-view loading">
        <div className="spinner"></div>
        <h1>Connecting...</h1>
        <p>Joining game {code?.toUpperCase()}</p>
      </div>
    );
  }

  const phase = gameState.phase;
  const players = gameState.players;

  // Game ended
  if (finalScores && winner) {
    return <TVGameEnd players={players} />;
  }

  // Lobby - waiting for game to start
  if (phase === 'lobby') {
    return (
      <div className="spectator-view lobby">
        <div className="spectator-header">
          <span className="spectator-badge">Spectating</span>
          <h1>Sushi Go!</h1>
        </div>
        <div className="lobby-info">
          <p>
            {players.length} player{players.length !== 1 ? 's' : ''} joined
          </p>
          <div className="player-list">
            {players.map((player) => (
              <div key={player.id} className="player-item">
                {player.name}
                {player.seatIndex !== null && (
                  <span className="seat-badge">Seat {player.seatIndex + 1}</span>
                )}
              </div>
            ))}
          </div>
          <p className="waiting-text">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  // Playing or round end - show the game board
  return (
    <div className="spectator-view playing">
      <div className="spectator-indicator">Spectating</div>
      <TVGameBoard
        players={players}
        currentRound={gameState.currentRound}
        currentTurn={gameState.currentTurn}
        phase={phase}
      />
      {phase === 'round_end' && (
        <div className="round-end-overlay">
          <h2>Round {gameState.currentRound} Complete!</h2>
          <p>Next round starting soon...</p>
        </div>
      )}
    </div>
  );
}
