import { GamePhase } from '../../types';
import './RoundInfo.css';

interface RoundInfoProps {
  round: number;
  turn: number;
  phase: GamePhase;
}

export function RoundInfo({ round, turn, phase }: RoundInfoProps) {
  return (
    <div className="round-info">
      <div className="round-number">
        <span className="label">Round</span>
        <span className="value">{round}/3</span>
      </div>
      <div className="turn-number">
        <span className="label">Turn</span>
        <span className="value">{turn}</span>
      </div>
      <div className="phase-indicator">
        <span className={`phase-dot ${phase === 'playing' ? 'active' : ''}`}></span>
        <span className="phase-text">
          {phase === 'playing' ? 'Selecting Cards' : 'Round End'}
        </span>
      </div>
    </div>
  );
}
