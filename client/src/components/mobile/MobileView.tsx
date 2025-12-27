import { useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { JoinGame } from './JoinGame';
import { SeatSelect } from './SeatSelect';
import { PlayerHand } from './PlayerHand';
import { WaitingScreen } from './WaitingScreen';
import { RoundScoreBreakdown } from './RoundScoreBreakdown';
import { GameScoreBreakdown } from './GameScoreBreakdown';
import './MobileView.css';

export function MobileView() {
  const { code } = useParams<{ code?: string }>();
  const { gameState, myPlayerId, roundScores, finalScores, winner, selectSeat } = useGame();

  const phase = gameState?.phase;
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);

  // Not joined yet
  if (!myPlayerId || !gameState) {
    return <JoinGame initialCode={code} />;
  }

  // Game ended
  if (finalScores && winner && myPlayer) {
    const myRank = finalScores.findIndex(s => s.playerId === myPlayerId) + 1;
    const isWinner = myPlayerId === winner;
    const myScore = finalScores.find(s => s.playerId === myPlayerId);

    if (myScore) {
      return (
        <GameScoreBreakdown
          player={myPlayer}
          allPlayers={gameState.players}
          finalScore={myScore}
          isWinner={isWinner}
          rank={myRank}
        />
      );
    }
  }

  // In lobby - seat selection or waiting
  if (phase === 'lobby') {
    // Need to select a seat
    if (myPlayer?.seatIndex === null) {
      return (
        <SeatSelect
          players={gameState.players}
          onSelectSeat={selectSeat}
        />
      );
    }

    // Already seated, waiting for game to start
    return (
      <div className="mobile-view lobby">
        <h1>Ready to Play!</h1>
        <div className="player-info">
          <span className="player-name">{myPlayer?.name}</span>
          <span className="player-status">Seat {(myPlayer?.seatIndex ?? 0) + 1}</span>
        </div>
        <div className="waiting-message">
          <div className="spinner"></div>
          <p>Waiting for other players to select seats...</p>
          <p className="player-count">{gameState.players.length} / {gameState.maxPlayers} players</p>
        </div>
      </div>
    );
  }

  // Playing - show hand or waiting screen
  if (phase === 'playing') {
    if (myPlayer?.hasConfirmed) {
      return <WaitingScreen gameState={gameState} />;
    }
    return <PlayerHand />;
  }

  // Round end
  if (phase === 'round_end' && myPlayer) {
    const myRoundScore = roundScores?.find(s => s.playerId === myPlayerId);
    return (
      <RoundScoreBreakdown
        player={myPlayer}
        allPlayers={gameState.players}
        roundScore={myRoundScore}
        currentRound={gameState.currentRound}
      />
    );
  }

  return <WaitingScreen gameState={gameState} />;
}
