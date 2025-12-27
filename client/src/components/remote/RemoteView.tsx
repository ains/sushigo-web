import { useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { RemoteJoin } from './RemoteJoin';
import { RemoteLobby } from './RemoteLobby';
import { RemoteGamePlay } from './RemoteGamePlay';
import { TVGameEnd } from '../tv/TVGameEnd';
import { TVGameBoard } from '../tv/TVGameBoard';
import './RemoteView.css';

export function RemoteView() {
  const { code } = useParams<{ code?: string }>();
  const { gameState, myPlayerId, isHost, restartGame, roundScores } = useGame();

  const phase = gameState?.phase;
  const players = gameState?.players || [];

  // Not joined yet - show join/create form
  if (!myPlayerId || !gameState) {
    return <RemoteJoin initialCode={code} />;
  }

  // Game ended - show leaderboard
  if (phase === 'game_end') {
    return <TVGameEnd players={players} onPlayAgain={isHost ? restartGame : undefined} />;
  }

  // In lobby - show lobby with seat selection
  if (phase === 'lobby') {
    return <RemoteLobby />;
  }

  // Round end - show board with scores overlay
  if (phase === 'round_end') {
    return (
      <div className="remote-gameplay round-end">
        <div className="board-section">
          <TVGameBoard
            players={players}
            currentRound={gameState.currentRound}
            currentTurn={gameState.currentTurn}
            phase={gameState.phase}
          />
        </div>
        <div className="round-end-overlay">
          <div className="round-end-content">
            <h2>Round {gameState.currentRound} Complete!</h2>
            {roundScores && (
              <div className="round-scores">
                {roundScores
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((score, index) => {
                    const player = players.find((p) => p.id === score.playerId);
                    return (
                      <div key={score.playerId} className="score-row">
                        <span className="rank">#{index + 1}</span>
                        <span className="name">{player?.name}</span>
                        <span className="round-score">+{score.roundScore}</span>
                        <span className="total-score">{score.totalScore} pts</span>
                      </div>
                    );
                  })}
              </div>
            )}
            <p className="next-round-hint">Next round starting soon...</p>
          </div>
        </div>
      </div>
    );
  }

  // Playing - show game board with hand
  if (phase === 'playing') {
    return <RemoteGamePlay />;
  }

  // Fallback
  return <RemoteGamePlay />;
}
