import { Server, Socket } from 'socket.io';
import { gameManager } from '../game/GameManager.js';
import { ClientToServerEvents, ServerToClientEvents } from '../types/index.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: GameServer): void {
  io.on('connection', (socket: GameSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a new game (tablet/host)
    socket.on('game:create', () => {
      const game = gameManager.createGame(socket.id);
      socket.join(game.id);

      socket.emit('game:created', {
        gameCode: game.code,
        gameId: game.id,
        gameState: game.getPublicState()
      });

      console.log(`Game created: ${game.code} by ${socket.id}`);
    });

    // Join an existing game (mobile/player)
    socket.on('game:join', ({ code, name }) => {
      const game = gameManager.getGameByCode(code);

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      const player = game.addPlayer(socket.id, name);

      if (!player) {
        socket.emit('game:error', { message: 'Unable to join game. It may be full or already started.' });
        return;
      }

      socket.join(game.id);

      // Notify all players in the game
      const publicState = game.getPublicState();
      const publicPlayer = publicState.players.find(p => p.id === player.id)!;

      io.to(game.id).emit('player:joined', {
        player: publicPlayer,
        players: publicState.players,
        gameState: publicState
      });

      console.log(`Player ${name} joined game ${game.code}`);
    });

    // Player selects a seat
    socket.on('seat:select', ({ seatIndex }) => {
      const game = gameManager.getGameBySocket(socket.id);
      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      if (!game.selectSeat(socket.id, seatIndex)) {
        socket.emit('game:error', { message: 'Cannot select that seat' });
        return;
      }

      // Notify all players of the update
      io.to(game.id).emit('state:update', {
        gameState: game.getPublicState()
      });
    });

    // Start the game (host only)
    socket.on('game:start', () => {
      const game = gameManager.getGameBySocket(socket.id);

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      if (game.hostSocketId !== socket.id) {
        socket.emit('game:error', { message: 'Only the host can start the game' });
        return;
      }

      if (!game.start()) {
        socket.emit('game:error', { message: 'Cannot start game. Need at least 2 players.' });
        return;
      }

      // Send game started to all
      io.to(game.id).emit('game:started', {
        gameState: game.getPublicState()
      });

      // Send individual hands to each player
      for (const player of game.players) {
        io.to(player.socketId).emit('hand:dealt', {
          hand: player.hand
        });
      }

      console.log(`Game ${game.code} started`);
    });

    // Player selects cards
    socket.on('card:select', ({ cardIds }) => {
      const game = gameManager.getGameBySocket(socket.id);
      if (!game) return;

      const success = game.selectCards(socket.id, cardIds);
      if (!success) {
        socket.emit('game:error', { message: 'Invalid card selection' });
      }
    });

    // Player confirms their selection
    socket.on('card:confirm', () => {
      const game = gameManager.getGameBySocket(socket.id);
      if (!game) return;

      const player = game.getPlayerBySocket(socket.id);
      if (!player) return;

      if (!game.confirmSelection(socket.id)) {
        socket.emit('game:error', { message: 'Cannot confirm. No cards selected.' });
        return;
      }

      // Notify others that this player is ready
      io.to(game.id).emit('player:ready', { playerId: player.id });

      // Check if all players are ready
      if (game.allPlayersConfirmed()) {
        // Reveal cards
        const revealed = game.revealCards();

        io.to(game.id).emit('cards:revealed', {
          revealedCards: revealed,
          gameState: game.getPublicState()
        });

        // Process turn and check game state
        const result = game.processTurn();

        if (result === 'continue') {
          // Send new hands to players
          for (const p of game.players) {
            io.to(p.socketId).emit('hand:dealt', {
              hand: p.hand
            });
          }

          // Update game state
          io.to(game.id).emit('state:update', {
            gameState: game.getPublicState()
          });
        } else if (result === 'round_end') {
          // Send round end with scores
          io.to(game.id).emit('round:end', {
            scores: game.getRoundScores(),
            gameState: game.getPublicState()
          });

          // Auto-start next round after a delay (handled client-side)
          setTimeout(() => {
            if (game.phase === 'round_end') {
              game.startNextRound();

              io.to(game.id).emit('game:started', {
                gameState: game.getPublicState()
              });

              for (const p of game.players) {
                io.to(p.socketId).emit('hand:dealt', {
                  hand: p.hand
                });
              }
            }
          }, 5000);
        } else if (result === 'game_end') {
          const finalScores = game.getFinalScores();
          const winner = game.getWinner();

          io.to(game.id).emit('game:end', {
            finalScores,
            winner
          });
        }
      }
    });

    // Restart game
    socket.on('game:restart', () => {
      const game = gameManager.getGameBySocket(socket.id);
      if (!game) return;

      if (game.hostSocketId !== socket.id) {
        socket.emit('game:error', { message: 'Only the host can restart the game' });
        return;
      }

      game.restart();

      io.to(game.id).emit('state:update', {
        gameState: game.getPublicState()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      const game = gameManager.getGameBySocket(socket.id);
      if (game) {
        game.removePlayer(socket.id);

        io.to(game.id).emit('state:update', {
          gameState: game.getPublicState()
        });

        // Clean up empty games
        if (game.playerCount === 0 && game.hostSocketId === socket.id) {
          gameManager.removeGame(game.id);
        }
      }
    });
  });
}
