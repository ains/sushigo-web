import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import './JoinGame.css';

interface JoinGameProps {
  initialCode?: string;
}

export function JoinGame({ initialCode }: JoinGameProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode?.toUpperCase() || '');
  const { joinGame, isConnected, error } = useGame();

  // Auto-focus code input if no initial code
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim() && isConnected) {
      joinGame(code.trim(), name.trim());
    }
  };

  const canJoin = name.trim().length > 0 && code.trim().length === 4 && isConnected;

  return (
    <div className="join-game">
      <h1>Join Game</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">Game Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>
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
        <button
          type="submit"
          className="btn btn-primary btn-large join-btn"
          disabled={!canJoin}
        >
          Join Game
        </button>
      </form>
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}
