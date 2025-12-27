import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { SeatSelect } from '../mobile/SeatSelect';
import { QRCodeSVG } from 'qrcode.react';
import './RemoteView.css';

export function RemoteLobby() {
  const { gameState, gameCode, isHost, selectSeat, startGame, myPlayerId } = useGame();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    // Get the server URL for the QR code
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const url = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    setServerUrl(url);
  }, []);

  const players = gameState?.players || [];
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hasSelectedSeat = myPlayer?.seatIndex !== null && myPlayer?.seatIndex !== undefined;

  // Check if all players are seated
  const allPlayersSeated = players.length >= 2 && players.every((p) => p.seatIndex !== null);
  const canStart = isHost && allPlayersSeated;

  const joinUrl = serverUrl && gameCode ? `${serverUrl}/remote/${gameCode}` : '';

  const handleStartGame = () => {
    if (canStart) {
      startGame();
    }
  };

  return (
    <div className="remote-lobby">
      <div className="lobby-header">
        <h1>Game Lobby</h1>
        <p className="player-count">
          {players.length} player{players.length !== 1 ? 's' : ''} joined
        </p>
      </div>

      <div className="lobby-content">
        {/* Share section */}
        <div className="share-section">
          <h2>Invite Friends</h2>
          {serverUrl && gameCode && (
            <div className="qr-container">
              <QRCodeSVG
                value={joinUrl}
                size={160}
                level="M"
                includeMargin
                bgColor="#ffffff"
                fgColor="#1a1a2e"
              />
              <div className="share-info">
                <div className="game-code-display">
                  <span className="code-label">Code:</span>
                  <span className="code-value">{gameCode}</span>
                </div>
                <p className="share-url">{joinUrl}</p>
              </div>
            </div>
          )}
        </div>

        {/* Players list */}
        <div className="players-section">
          <h2>Players</h2>
          <div className="players-list">
            {players.map((player) => (
              <div
                key={player.id}
                className={`player-item ${player.id === myPlayerId ? 'is-me' : ''}`}
              >
                <span className="player-name">
                  {player.name}
                  {player.id === myPlayerId && ' (you)'}
                </span>
                <span className={`seat-status ${player.seatIndex !== null ? 'seated' : 'waiting'}`}>
                  {player.seatIndex !== null ? `Seat ${player.seatIndex + 1}` : 'Choosing seat...'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seat selection or waiting */}
        <div className="seat-section">
          {!hasSelectedSeat ? (
            <SeatSelect players={players} onSelectSeat={selectSeat} />
          ) : (
            <div className="seated-message">
              <p>You are in Seat {(myPlayer?.seatIndex ?? 0) + 1}</p>
              {isHost ? (
                <div className="host-controls">
                  <button
                    className="btn btn-success btn-large"
                    onClick={handleStartGame}
                    disabled={!canStart}
                  >
                    {allPlayersSeated ? 'Start Game' : 'Waiting for players to select seats...'}
                  </button>
                  {players.length < 2 && (
                    <p className="waiting-hint">Need at least 2 players to start</p>
                  )}
                </div>
              ) : (
                <p className="waiting-hint">Waiting for host to start the game...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
