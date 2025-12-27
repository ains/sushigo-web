import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { Card } from "../shared/Card";
import "./PlayerHand.css";

export function PlayerHand() {
  const {
    hand,
    selectedCards,
    toggleCardSelection,
    confirmSelection,
    gameState,
    myPlayerId,
  } = useGame();
  const [isPassingCards, setIsPassingCards] = useState(false);
  const [passDirection, setPassDirection] = useState<"left" | "right">("right");
  const [isReceivingCards, setIsReceivingCards] = useState(false);
  const prevHandRef = useRef<string | null>(null);

  const players = gameState?.players || [];
  const myIndex = players.findIndex((p) => p.id === myPlayerId);
  const currentRound = gameState?.currentRound || 1;
  const myPlayer = players[myIndex];
  const hasChopsticks = myPlayer?.playedCards[currentRound - 1]?.some(
    (c) => c.type === "chopsticks"
  );
  const maxCards = hasChopsticks ? 2 : 1;

  // Determine pass direction: odd rounds = clockwise, even rounds = counter-clockwise
  const isClockwise = currentRound % 2 === 1;

  // Detect when we receive a new hand and trigger entrance animation
  // This runs on mount (returning from WaitingScreen) and when hand changes
  useEffect(() => {
    const handKey = hand.map((c) => c.id).join(",");
    const currentTurn = gameState?.currentTurn || 1;
    const currentRound = gameState?.currentRound || 1;
    const isFirstTurnOfGame = currentTurn === 1 && currentRound === 1;

    // Animate if:
    // 1. Component just mounted with cards (prevHandRef is null) AND it's not the first turn
    // 2. Hand changed while mounted (prevHandRef differs from current)
    const shouldAnimate = hand.length > 0 && (
      (prevHandRef.current === null && !isFirstTurnOfGame) ||
      (prevHandRef.current !== null && prevHandRef.current !== handKey)
    );

    if (shouldAnimate) {
      setIsReceivingCards(true);
      const timer = setTimeout(() => {
        setIsReceivingCards(false);
      }, 1100); // Animation duration (600ms) + max stagger delay (450ms)
      return () => clearTimeout(timer);
    }
    prevHandRef.current = handKey;
  }, [hand, gameState?.currentTurn, gameState?.currentRound]);

  // Calculate who we pass to
  const numPlayers = players.length;
  let passToIndex: number;

  if (isClockwise) {
    // Clockwise: pass to next player
    passToIndex = (myIndex + 1) % numPlayers;
  } else {
    // Counter-clockwise: pass to previous player
    passToIndex = (myIndex - 1 + numPlayers) % numPlayers;
  }

  const passToPlayer = players[passToIndex];

  const canConfirm = selectedCards.length > 0 && !isPassingCards;

  const handleConfirm = () => {
    if (!canConfirm) return;

    // Set the pass direction for animation
    // Clockwise = cards fly right, Counter-clockwise = cards fly left
    setPassDirection(isClockwise ? "right" : "left");
    setIsPassingCards(true);

    // Wait for animation to complete before confirming
    setTimeout(() => {
      confirmSelection();
      // Reset animation state after a short delay (hand will be replaced by server)
      setTimeout(() => {
        setIsPassingCards(false);
      }, 100);
    }, 1100); // Animation duration (600ms) + max stagger delay (450ms)
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
          <div className="chopsticks-notice">🥢 You can play 2 cards!</div>
        )}
      </div>

      {numPlayers > 1 && (
        <div className="pass-info">
          <span className="pass-direction">
            {isClockwise ? "↻" : "↺"} Passing{" "}
            {isClockwise ? "clockwise" : "counter-clockwise"}
          </span>
          <div className="pass-details">
            <span>
              → Remaining cards will be passed to{" "}
              <strong>{passToPlayer?.name}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="instruction">
        Select {maxCards === 2 ? "1 or 2 cards" : "a card"} to play
      </div>

      <div className="cards-container">
        {hand.map((card) => {
          const isSelected = selectedCards.includes(card.id);
          const shouldFlyOff = isPassingCards && !isSelected;

          // Cards enter from the opposite direction they fly out
          // If clockwise (fly right), cards come from left; if counter-clockwise (fly left), cards come from right
          const enterDirection = isClockwise ? "left" : "right";

          return (
            <div
              key={card.id}
              className={`card-wrapper ${
                shouldFlyOff ? `flying-${passDirection}` : ""
              } ${isSelected && isPassingCards ? "playing" : ""} ${
                isReceivingCards ? `entering-from-${enterDirection}` : ""
              }`}
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
            ? "Passing cards..."
            : selectedCards.length === 0
            ? "Select a card"
            : selectedCards.length === 1
            ? "Play Card"
            : "Play 2 Cards"}
        </button>
      </div>
    </div>
  );
}
