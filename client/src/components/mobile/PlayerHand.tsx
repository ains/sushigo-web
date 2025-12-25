import { useGame } from '../../context/GameContext';
import { Card } from '../shared/Card';
import './PlayerHand.css';

export function PlayerHand() {
  const { hand, selectedCards, toggleCardSelection, confirmSelection, gameState, myPlayerId } = useGame();

  const players = gameState?.players || [];
  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const currentRound = gameState?.currentRound || 1;
  const myPlayer = players[myIndex];
  const hasChopsticks = myPlayer?.playedCards[currentRound - 1]?.some(c => c.type === 'chopsticks');
  const maxCards = hasChopsticks ? 2 : 1;

  // Determine pass direction: odd rounds = clockwise, even rounds = counter-clockwise
  const isClockwise = currentRound % 2 === 1;

  // Calculate who we pass to and receive from
  const numPlayers = players.length;
  let passToIndex: number;
  let receiveFromIndex: number;

  if (isClockwise) {
    // Clockwise: pass to next player, receive from previous
    passToIndex = (myIndex + 1) % numPlayers;
    receiveFromIndex = (myIndex - 1 + numPlayers) % numPlayers;
  } else {
    // Counter-clockwise: pass to previous player, receive from next
    passToIndex = (myIndex - 1 + numPlayers) % numPlayers;
    receiveFromIndex = (myIndex + 1) % numPlayers;
  }

  const passToPlayer = players[passToIndex];
  const receiveFromPlayer = players[receiveFromIndex];

  const canConfirm = selectedCards.length > 0;

  return (
    <div className="player-hand">
      <div className="hand-header">
        <div className="round-info">
          <span>Round {gameState?.currentRound || 1}</span>
          <span className="separator">•</span>
          <span>Turn {gameState?.currentTurn || 1}</span>
        </div>
        {hasChopsticks && (
          <div className="chopsticks-notice">
            🥢 You can play 2 cards!
          </div>
        )}
      </div>

      {numPlayers > 1 && (
        <div className="pass-info">
          <span className="pass-direction">
            {isClockwise ? '↻' : '↺'} Passing {isClockwise ? 'clockwise' : 'counter-clockwise'}
          </span>
          <div className="pass-details">
            <span>→ To <strong>{passToPlayer?.name}</strong></span>
            <span>← From <strong>{receiveFromPlayer?.name}</strong></span>
          </div>
        </div>
      )}

      <div className="instruction">
        Select {maxCards === 2 ? '1 or 2 cards' : 'a card'} to play
      </div>

      <div className="cards-container">
        {hand.map(card => (
          <Card
            key={card.id}
            card={card}
            size="large"
            selected={selectedCards.includes(card.id)}
            onClick={() => toggleCardSelection(card.id)}
          />
        ))}
      </div>

      <div className="confirm-section">
        <button
          className="btn btn-success btn-large confirm-btn"
          disabled={!canConfirm}
          onClick={confirmSelection}
        >
          {selectedCards.length === 0
            ? 'Select a card'
            : selectedCards.length === 1
              ? 'Play Card'
              : 'Play 2 Cards'}
        </button>
      </div>
    </div>
  );
}
