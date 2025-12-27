import { useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { RemoteJoin } from './RemoteJoin';
import { RemoteLobby } from './RemoteLobby';
import { RemoteGamePlay } from './RemoteGamePlay';
import { TVGameEnd } from '../tv/TVGameEnd';
import { RoundScoreBreakdown } from '../mobile/RoundScoreBreakdown';
import './RemoteView.css';

export function RemoteView() {
  const { code } = useParams<{ code?: string }>();
  const { gameState, myPlayerId, isHost, restartGame } = useGame();

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

  // Round end - show score breakdown for current player
  if (phase === 'round_end') {
    const myPlayer = players.find((p) => p.id === myPlayerId);

    return (
      <div className="remote-gameplay round-end">
        <div className="round-end-overlay">
          {myPlayer && (
            <RoundScoreBreakdown
              player={myPlayer}
              allPlayers={players}
              currentRound={gameState.currentRound}
            />
          )}
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
