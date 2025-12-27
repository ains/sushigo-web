import { useEffect, useState } from "react";
import { useGame } from "../../context/GameContext";
import { QRCodeDisplay } from "../tablet/QRCodeDisplay";
import { SeatLayout } from "../tablet/SeatLayout";
import { TVGameBoard } from "./TVGameBoard";
import { TVGameEnd } from "./TVGameEnd";
import "./TVView.css";

export function TVView() {
  const {
    gameState,
    gameCode,
    createGame,
    startGame,
    restartGame,
    finalScores,
    winner,
    isConnected,
  } = useGame();
  const [serverUrl, setServerUrl] = useState<string>("");

  useEffect(() => {
    // Get server info for QR code
    fetch("/api/server-info")
      .then((res) => res.json())
      .then((data) => setServerUrl(data.url))
      .catch(() => setServerUrl(window.location.origin));
  }, []);

  // Auto-create game when connected and no game exists
  useEffect(() => {
    if (isConnected && !gameCode && !gameState) {
      createGame();
    }
  }, [isConnected, gameCode, gameState, createGame]);

  const phase = gameState?.phase || "lobby";
  const players = gameState?.players || [];
  const allSeated =
    players.length >= 2 && players.every((p) => p.seatIndex !== null);
  const canStart = allSeated;

  // Game ended
  if (finalScores && winner && gameState) {
    return <TVGameEnd players={gameState.players} onPlayAgain={restartGame} />;
  }

  // Lobby - waiting for players
  if (phase === "lobby") {
    const unseatedPlayers = players.filter((p) => p.seatIndex === null);
    const seatedCount = players.filter((p) => p.seatIndex !== null).length;

    return (
      <div className="tv-view lobby">
        <div className="lobby-header">
          <h1>Sushi Go!</h1>
          <div className="lobby-status">
            {players.length} player{players.length !== 1 ? "s" : ""} joined
            {seatedCount > 0 && ` • ${seatedCount} seated`}
          </div>
        </div>

        <div className="lobby-content">
          <div className="qr-section">
            {gameCode && serverUrl && (
              <QRCodeDisplay code={gameCode} serverUrl={serverUrl} />
            )}
            {unseatedPlayers.length > 0 && (
              <div className="unseated-players">
                <div className="unseated-label">Select a seat:</div>
                {unseatedPlayers.map((player) => (
                  <div key={player.id} className="unseated-player">
                    {player.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="seats-section">
            <SeatLayout players={players} />
            <button
              className="btn btn-success btn-large start-btn"
              disabled={!canStart}
              onClick={startGame}
            >
              {players.length < 2
                ? "Need at least 2 players"
                : !allSeated
                ? "All players must select a seat"
                : "Start Game"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing or round end
  return (
    <div className="tv-view playing">
      <TVGameBoard
        players={players}
        currentRound={gameState?.currentRound || 1}
        currentTurn={gameState?.currentTurn || 1}
        phase={phase}
      />
      {phase === "round_end" && (
        <div className="round-end-overlay">
          <h2>Round {gameState?.currentRound} Complete!</h2>
          <p>Next round starting soon...</p>
        </div>
      )}
    </div>
  );
}
