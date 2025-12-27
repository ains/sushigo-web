import { PublicPlayer } from '../../types';
import './SeatLayout.css';

interface SeatLayoutProps {
  players: PublicPlayer[];
}

export function SeatLayout({ players }: SeatLayoutProps) {
  // Get player at each seat (0-3)
  const getPlayerAtSeat = (seatIndex: number): PublicPlayer | undefined => {
    return players.find((p) => p.seatIndex === seatIndex);
  };

  const renderSeat = (seatIndex: number, isTop: boolean) => {
    const player = getPlayerAtSeat(seatIndex);
    const seatNumber = seatIndex + 1;

    return (
      <div className={`seat ${player ? 'occupied' : 'empty'} ${isTop ? 'flipped' : ''}`}>
        {player ? (
          <>
            <div className="seat-player-name">{player.name}</div>
            <div className="seat-status">{player.isConnected ? '✓ Ready' : 'Disconnected'}</div>
          </>
        ) : (
          <>
            <div className="seat-number">Seat {seatNumber}</div>
            <div className="seat-waiting">Waiting...</div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="seat-layout">
      {/* Top side - seats 2 and 3 (indices 2, 3) - flipped for opposite players */}
      <div className="table-row top-row">
        {renderSeat(2, true)}
        {renderSeat(3, true)}
      </div>

      {/* Table surface */}
      <div className="table-surface">
        <span className="table-label">TABLE</span>
      </div>

      {/* Bottom side - seats 0 and 1 (indices 0, 1) */}
      <div className="table-row bottom-row">
        {renderSeat(0, false)}
        {renderSeat(1, false)}
      </div>
    </div>
  );
}
