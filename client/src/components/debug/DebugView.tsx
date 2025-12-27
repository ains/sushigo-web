import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { RoundScoreBreakdown } from '../mobile/RoundScoreBreakdown';
import { GameScoreBreakdown } from '../mobile/GameScoreBreakdown';
import { GameBoard } from '../tablet/GameBoard';
import { TVGameBoard } from '../tv/TVGameBoard';
import { TVGameEnd } from '../tv/TVGameEnd';
import {
  createMockGameState,
  createMockHand,
  createMockFinalScores,
} from './mockData';
import './DebugView.css';

type ViewType = 'mid-round' | 'round-end' | 'game-end';
type DisplayMode = 'mobile' | 'tablet' | 'tv';

// Mock context provider for debug views
function DebugMobileView({ view }: { view: ViewType }) {
  const gameState = createMockGameState(view);
  const myPlayer = gameState.players[0];
  const hand = createMockHand();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  if (view === 'mid-round') {
    // Simulate PlayerHand with mock data
    return (
      <div className="debug-mobile-container">
        <div className="debug-info">Debug: Mid-Round (Playing)</div>
        <MockPlayerHand
          hand={hand}
          selectedCards={selectedCards}
          onToggleCard={(cardId) => {
            setSelectedCards(prev =>
              prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [cardId]
            );
          }}
          gameState={gameState}
        />
      </div>
    );
  }

  if (view === 'round-end') {
    return (
      <div className="debug-mobile-container">
        <div className="debug-info">Debug: Round End</div>
        <RoundScoreBreakdown
          player={myPlayer}
          allPlayers={gameState.players}
          currentRound={gameState.currentRound}
        />
      </div>
    );
  }

  if (view === 'game-end') {
    const finalScores = createMockFinalScores(gameState.players);
    const myRank = finalScores.findIndex(s => s.playerId === myPlayer.id) + 1;
    const isWinner = myRank === 1;

    return (
      <div className="debug-mobile-container">
        <div className="debug-info">Debug: Game End</div>
        <GameScoreBreakdown
          player={myPlayer}
          allPlayers={gameState.players}
          isWinner={isWinner}
          rank={myRank}
        />
      </div>
    );
  }

  return null;
}

// Mock PlayerHand component for debugging (since real one needs context)
import { Card } from '../shared/Card';
import { PublicGameState, Card as CardType } from '../../types';

function MockPlayerHand({
  hand,
  selectedCards,
  onToggleCard,
  gameState,
}: {
  hand: CardType[];
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
  gameState: PublicGameState;
}) {
  const currentRound = gameState.currentRound;
  const isClockwise = currentRound % 2 === 1;
  const passToPlayer = gameState.players[1];

  return (
    <div className="player-hand">
      <div className="hand-header">
        <div className="round-info">
          <span>Round {currentRound}</span>
          <span className="separator">•</span>
          <span>Turn {gameState.currentTurn}</span>
        </div>
      </div>

      <div className="pass-info">
        <span className="pass-direction">
          {isClockwise ? '↻' : '↺'} Passing {isClockwise ? 'clockwise' : 'counter-clockwise'}
        </span>
        <div className="pass-details">
          <span>
            → Remaining cards will be passed to <strong>{passToPlayer?.name}</strong>
          </span>
        </div>
      </div>

      <div className="instruction">Select a card to play</div>

      <div className="cards-container">
        {hand.map(card => (
          <div key={card.id} className="card-wrapper">
            <Card
              card={card}
              size="large"
              selected={selectedCards.includes(card.id)}
              onClick={() => onToggleCard(card.id)}
            />
          </div>
        ))}
      </div>

      <div className="confirm-section">
        <button
          className="btn btn-success btn-large confirm-btn"
          disabled={selectedCards.length === 0}
        >
          {selectedCards.length === 0 ? 'Select a card' : 'Play Card'}
        </button>
      </div>
    </div>
  );
}

function DebugTabletView({ view }: { view: ViewType }) {
  const gameState = createMockGameState(view);

  return (
    <div className="debug-tablet-container">
      <div className="debug-info">Debug: {view} (Tablet View)</div>
      <GameBoard players={gameState.players} currentRound={gameState.currentRound} />
      {view === 'round-end' && (
        <div className="round-end-overlay">
          <h2>Round {gameState.currentRound} Complete!</h2>
          <p>Next round starting soon...</p>
        </div>
      )}
      {view === 'game-end' && (
        <div className="round-end-overlay">
          <h2>Game Over!</h2>
          <p>Winner: {gameState.players.sort((a, b) => b.score - a.score)[0].name}</p>
        </div>
      )}
    </div>
  );
}

function DebugTVView({ view }: { view: ViewType }) {
  const gameState = createMockGameState(view);

  if (view === 'game-end') {
    return (
      <div className="debug-tv-container">
        <div className="debug-info">Debug: {view} (TV View)</div>
        <TVGameEnd players={gameState.players} />
      </div>
    );
  }

  return (
    <div className="debug-tv-container">
      <div className="debug-info">Debug: {view} (TV View)</div>
      <TVGameBoard
        players={gameState.players}
        currentRound={gameState.currentRound}
        currentTurn={gameState.currentTurn}
        phase={gameState.phase}
      />
      {view === 'round-end' && (
        <div className="round-end-overlay">
          <h2>Round {gameState.currentRound} Complete!</h2>
          <p>Next round starting soon...</p>
        </div>
      )}
    </div>
  );
}

export function DebugView() {
  const { view } = useParams<{ view: string }>();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('mobile');

  const validViews: ViewType[] = ['mid-round', 'round-end', 'game-end'];
  const currentView = validViews.includes(view as ViewType) ? (view as ViewType) : null;

  if (!currentView) {
    return (
      <div className="debug-index">
        <h1>Debug Views</h1>
        <p>Select a game state to preview:</p>
        <nav className="debug-nav">
          <Link to="/debug/mid-round" className="debug-link">
            <span className="debug-link-title">Mid-Round</span>
            <span className="debug-link-desc">Playing phase with hand selection</span>
          </Link>
          <Link to="/debug/round-end" className="debug-link">
            <span className="debug-link-title">Round End</span>
            <span className="debug-link-desc">Score breakdown after a round</span>
          </Link>
          <Link to="/debug/game-end" className="debug-link">
            <span className="debug-link-title">Game End</span>
            <span className="debug-link-desc">Final scores and winner</span>
          </Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="debug-view">
      <div className="debug-controls">
        <Link to="/debug" className="debug-back">← Back</Link>
        <div className="debug-mode-switcher">
          <button
            className={displayMode === 'mobile' ? 'active' : ''}
            onClick={() => setDisplayMode('mobile')}
          >
            Mobile
          </button>
          <button
            className={displayMode === 'tablet' ? 'active' : ''}
            onClick={() => setDisplayMode('tablet')}
          >
            Tablet
          </button>
          <button
            className={displayMode === 'tv' ? 'active' : ''}
            onClick={() => setDisplayMode('tv')}
          >
            TV
          </button>
        </div>
        <div className="debug-view-switcher">
          {validViews.map(v => (
            <Link
              key={v}
              to={`/debug/${v}`}
              className={`debug-view-link ${v === currentView ? 'active' : ''}`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      <div className={`debug-content debug-content-${displayMode}`}>
        {displayMode === 'mobile' && <DebugMobileView view={currentView} />}
        {displayMode === 'tablet' && <DebugTabletView view={currentView} />}
        {displayMode === 'tv' && <DebugTVView view={currentView} />}
      </div>
    </div>
  );
}
