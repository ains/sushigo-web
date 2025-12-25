import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Card } from '../shared/Card';
import './PlayerHand.css';

export function PlayerHand() {
  const { hand, selectedCards, toggleCardSelection, confirmSelection, gameState, myPlayerId } = useGame();
  const [isPassingCards, setIsPassingCards] = useState(false);
  const [passDirection, setPassDirection] = useState<'left' | 'right'>('right');

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

  const canConfirm = selectedCards.length > 0 && !isPassingCards;

  const handleConfirm = () => {
    if (!canConfirm) return;

    // Set the pass direction for animation
    // Clockwise = cards fly right, Counter-clockwise = cards fly left
    setPassDirection(isClockwise ? 'right' : 'left');
    setIsPassingCards(true);

    // Wait for animation to complete before confirming
    setTimeout(() => {
      confirmSelection();
      // Reset animation state after a short delay (hand will be replaced by server)
      setTimeout(() => {
        setIsPassingCards(false);
      }, 100);
    }, 400); // Match animation duration
  };

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
        {hand.map(card => {
          const isSelected = selectedCards.includes(card.id);
          const shouldFlyOff = isPassingCards && !isSelected;

          return (
            <div
              key={card.id}
              className={`card-wrapper ${shouldFlyOff ? `flying-${passDirection}` : ''} ${isSelected && isPassingCards ? 'playing' : ''}`}
            >
              <Card
                card={card}
                size="large"
                selected={isSelected}
                onClick={() => !isPassingCards && toggleCardSelection(card.id)}
                disabled={isPassingCards}
              />
            </div>
          );
        })}
      </div>

      <div className="confirm-section">
        <button
          className="btn btn-success btn-large confirm-btn"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {isPassingCards
            ? 'Passing cards...'
            : selectedCards.length === 0
              ? 'Select a card'
              : selectedCards.length === 1
                ? 'Play Card'
                : 'Play 2 Cards'}
        </button>
      </div>
    </div>
  );
}
