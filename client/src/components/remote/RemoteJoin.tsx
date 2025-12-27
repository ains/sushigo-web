import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import './RemoteView.css';

interface RemoteJoinProps {
  initialCode?: string;
}

export function RemoteJoin({ initialCode }: RemoteJoinProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode?.toUpperCase() || '');
  const { createAndJoinGame, joinGame, isConnected, error } = useGame();

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && isConnected) {
      createAndJoinGame(name.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim() && isConnected) {
      joinGame(code.trim(), name.trim());
    }
  };

  const canCreate = name.trim().length > 0 && isConnected;
  const canJoin = name.trim().length > 0 && code.trim().length === 4 && isConnected;
  const hasCode = initialCode || code.length > 0;

  return (
    <div className="remote-join">
      <h1>Remote Play</h1>
      <p className="remote-subtitle">Play Sushi Go! with friends online</p>

      <form onSubmit={hasCode ? handleJoin : handleCreate}>
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Enter your name"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        {!initialCode && (
          <div className="form-group">
            <label htmlFor="code">Game Code (optional)</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="Leave empty to create new game"
              maxLength={4}
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>
        )}

        {initialCode && (
          <div className="form-group">
            <label>Game Code</label>
            <div className="code-display">{initialCode}</div>
          </div>
        )}

        {hasCode ? (
          <button type="submit" className="btn btn-primary btn-large" disabled={!canJoin}>
            Join Game
          </button>
        ) : (
          <button type="submit" className="btn btn-success btn-large" disabled={!canCreate}>
            Create Game
          </button>
        )}
      </form>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
