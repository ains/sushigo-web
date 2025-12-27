import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, PublicGameState, ClientToServerEvents, ServerToClientEvents } from '../types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RevealedCards {
  playerId: string;
  cards: Card[];
}

export interface RoundScore {
  playerId: string;
  roundScore: number;
  totalScore: number;
}

interface GameContextType {
  socket: GameSocket | null;
  isConnected: boolean;
  gameState: PublicGameState | null;
  hand: Card[];
  selectedCards: string[];
  myPlayerId: string | null;
  gameCode: string | null;
  error: string | null;
  revealedCards: RevealedCards[] | null;
  roundScores: RoundScore[] | null;
  finalScores: { playerId: string; totalScore: number; puddings: number }[] | null;
  winner: string | null;

  // Actions
  createGame: () => void;
  joinGame: (code: string, name: string) => void;
  startGame: () => void;
  selectSeat: (seatIndex: number) => void;
  selectCards: (cardIds: string[]) => void;
  toggleCardSelection: (cardId: string) => void;
  confirmSelection: () => void;
  restartGame: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const myPlayerIdRef = useRef<string | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealedCards, setRevealedCards] = useState<RevealedCards[] | null>(null);
  const [roundScores, setRoundScores] = useState<RoundScore[] | null>(null);
  const [finalScores, setFinalScores] = useState<{ playerId: string; totalScore: number; puddings: number }[] | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    // In development, connect to the server on port 3000
    // In production, connect to the same origin
    const serverUrl = import.meta.env.DEV ? `http://${window.location.hostname}:3000` : undefined;

    const newSocket: GameSocket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('game:created', ({ gameCode: code, gameState: state }) => {
      setGameCode(code);
      setGameState(state);
    });

    newSocket.on('game:error', ({ message }) => {
      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      setError(message);
      // Auto-clear error after 3 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 3000);
    });

    newSocket.on('player:joined', ({ players, gameState: state }) => {
      // If this is us joining, store our player ID
      if (!myPlayerIdRef.current && players.length > 0) {
        const lastPlayer = players[players.length - 1];
        myPlayerIdRef.current = lastPlayer.id;
        setMyPlayerId(lastPlayer.id);
      }
      setGameState(state);
    });

    newSocket.on('game:started', ({ gameState: state }) => {
      setGameState(state);
      setRevealedCards(null);
      setSelectedCards([]);
    });

    newSocket.on('hand:dealt', ({ hand: newHand }) => {
      setHand(newHand);
      setSelectedCards([]);
      setRoundScores(null); // Clear round scores when new hand is dealt
    });

    newSocket.on('player:ready', ({ playerId }) => {
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId ? { ...p, hasConfirmed: true } : p
          )
        };
      });
    });

    newSocket.on('cards:revealed', ({ revealedCards: revealed, gameState: state }) => {
      setRevealedCards(revealed);
      setGameState(state);
      // Clear revealed cards after display
      setTimeout(() => setRevealedCards(null), 2000);
    });

    newSocket.on('round:end', ({ scores, gameState: state }) => {
      setRoundScores(scores);
      setGameState(state);
    });

    newSocket.on('game:end', ({ finalScores: scores, winner: winnerId }) => {
      setFinalScores(scores);
      setWinner(winnerId);
    });

    newSocket.on('state:update', ({ gameState: state }) => {
      setGameState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createGame = useCallback(() => {
    socket?.emit('game:create');
  }, [socket]);

  const joinGame = useCallback((code: string, name: string) => {
    socket?.emit('game:join', { code, name });
    setGameCode(code.toUpperCase());
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('game:start');
  }, [socket]);

  const selectSeat = useCallback((seatIndex: number) => {
    socket?.emit('seat:select', { seatIndex });
  }, [socket]);

  const selectCards = useCallback((cardIds: string[]) => {
    setSelectedCards(cardIds);
    socket?.emit('card:select', { cardIds });
  }, [socket]);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCards(prev => {
      // Check if player has chopsticks (can select 2)
      const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
      const currentRound = gameState?.currentRound || 1;
      const hasChopsticks = myPlayer?.playedCards[currentRound - 1]?.some(c => c.type === 'chopsticks');
      const maxCards = hasChopsticks ? 2 : 1;

      let newSelection: string[];
      if (prev.includes(cardId)) {
        newSelection = prev.filter(id => id !== cardId);
      } else {
        if (prev.length >= maxCards) {
          // Replace selection if at max
          newSelection = [cardId];
        } else {
          newSelection = [...prev, cardId];
        }
      }

      // Emit selection to server
      socket?.emit('card:select', { cardIds: newSelection });
      return newSelection;
    });
  }, [socket, gameState, myPlayerId]);

  const confirmSelection = useCallback(() => {
    if (selectedCards.length > 0) {
      socket?.emit('card:confirm');
    }
  }, [socket, selectedCards]);

  const restartGame = useCallback(() => {
    socket?.emit('game:restart');
    setFinalScores(null);
    setWinner(null);
    setHand([]);
    setSelectedCards([]);
  }, [socket]);

  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        socket,
        isConnected,
        gameState,
        hand,
        selectedCards,
        myPlayerId,
        gameCode,
        error,
        revealedCards,
        roundScores,
        finalScores,
        winner,
        createGame,
        joinGame,
        startGame,
        selectSeat,
        selectCards,
        toggleCardSelection,
        confirmSelection,
        restartGame,
        clearError
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
