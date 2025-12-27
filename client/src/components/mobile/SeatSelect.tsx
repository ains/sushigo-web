import { PublicPlayer } from '../../types';
import './SeatSelect.css';

interface SeatSelectProps {
  players: PublicPlayer[];
  onSelectSeat: (seatIndex: number) => void;
}

export function SeatSelect({ players, onSelectSeat }: SeatSelectProps) {
  const getPlayerAtSeat = (seatIndex: number): PublicPlayer | undefined => {
    return players.find((p) => p.seatIndex === seatIndex);
  };

  const renderSeat = (seatIndex: number) => {
    const player = getPlayerAtSeat(seatIndex);
    const isAvailable = !player;
    const seatNumber = seatIndex + 1;

    return (
      <button
        key={seatIndex}
        className={`seat-option ${isAvailable ? 'available' : 'taken'}`}
        onClick={() => isAvailable && onSelectSeat(seatIndex)}
        disabled={!isAvailable}
      >
        {player ? (
          <span className="seat-player">{player.name}</span>
        ) : (
          <span className="seat-label">Seat {seatNumber}</span>
        )}
      </button>
    );
  };

  return (
    <div className="seat-select">
      <h1>Select Your Seat</h1>
      <p className="seat-instruction">Tap a seat to claim your position at the table</p>

      <div className="table-layout">
        {/* Top seats (far side of table) - rotated so seat 3 appears on left when viewed from bottom */}
        <div className="seat-row top-seats">
          {renderSeat(2)}
          {renderSeat(3)}
        </div>

        {/* Table representation */}
        <div className="table-visual">
          <span>TABLE</span>
        </div>

        {/* Bottom seats (near side of table) */}
        <div className="seat-row bottom-seats">
          {renderSeat(0)}
          {renderSeat(1)}
        </div>
      </div>

      <div className="seat-hint">
        <p>Top seats face the bottom seats</p>
        <p>Choose based on where you're sitting!</p>
      </div>
    </div>
  );
}
