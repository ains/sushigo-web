import { useState } from 'react';
import { PublicPlayer } from '../../types';
import './ScoreBoard.css';

interface ScoreBoardProps {
  players: PublicPlayer[];
}

export function ScoreBoard({ players }: ScoreBoardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];

  return (
    <div className={`scoreboard ${isOpen ? 'open' : 'closed'}`}>
      <div className="scoreboard-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>Scores</h3>
        {!isOpen && leader && (
          <span className="leader-preview">
            {leader.name}: {leader.score}
          </span>
        )}
        <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="score-list">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className="score-item">
              <span className="position">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="pudding" title="Puddings">🍮 {player.puddings}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
