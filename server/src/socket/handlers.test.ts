import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers } from './handlers.js';
import { gameManager } from '../game/GameManager.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PublicGameState,
  PublicPlayer,
} from '../types/index.js';

type TypedClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

// Helper to wait for a socket event with a timeout
function waitFor<T>(
  socket: TypedClientSocket,
  event: keyof ServerToClientEvents,
  timeout = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${String(event)}`));
    }, timeout);

    socket.once(event as string, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('Socket Handlers - Game Creation', () => {
  let httpServer: HttpServer;
  let io: Server;
  let clientSocket: TypedClientSocket;
  let port: number;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);

      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'object' && address ? address.port : 3000;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  beforeEach(() => {
    gameManager.reset();
  });

  afterEach(() => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
  });

  it('creates a game and returns game code and state', async () => {
    clientSocket = ioc(`http://localhost:${port}`, {
      autoConnect: false,
    });

    const connectPromise = new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
    clientSocket.connect();
    await connectPromise;

    const gameCreatedPromise = waitFor<{
      gameCode: string;
      gameId: string;
      gameState: PublicGameState;
    }>(clientSocket, 'game:created');

    clientSocket.emit('game:create');

    const result = await gameCreatedPromise;

    expect(result.gameCode).toBeDefined();
    expect(result.gameCode).toHaveLength(4);
    expect(result.gameId).toBeDefined();
    expect(result.gameState).toBeDefined();
    expect(result.gameState.phase).toBe('lobby');
    expect(result.gameState.players).toEqual([]);
  });
});

describe('Socket Handlers - Joining Games', () => {
  let httpServer: HttpServer;
  let io: Server;
  let hostSocket: TypedClientSocket;
  let playerSocket: TypedClientSocket;
  let port: number;
  let gameCode: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);

      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'object' && address ? address.port : 3000;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    gameManager.reset();

    // Create host socket and game
    hostSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      hostSocket.on('connect', resolve);
      hostSocket.connect();
    });

    const gameCreatedPromise = waitFor<{
      gameCode: string;
      gameId: string;
      gameState: PublicGameState;
    }>(hostSocket, 'game:created');
    hostSocket.emit('game:create');
    const result = await gameCreatedPromise;
    gameCode = result.gameCode;
  });

  afterEach(() => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (playerSocket?.connected) playerSocket.disconnect();
  });

  it('allows a player to join with a valid code', async () => {
    playerSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      playerSocket.on('connect', resolve);
      playerSocket.connect();
    });

    const joinedPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(playerSocket, 'player:joined');

    playerSocket.emit('game:join', { code: gameCode, name: 'Alice' });

    const result = await joinedPromise;

    expect(result.player.name).toBe('Alice');
    expect(result.players).toHaveLength(1);
    expect(result.gameState.players).toHaveLength(1);
  });

  it('returns error for invalid game code', async () => {
    playerSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      playerSocket.on('connect', resolve);
      playerSocket.connect();
    });

    const errorPromise = waitFor<{ message: string }>(playerSocket, 'game:error');

    playerSocket.emit('game:join', { code: 'XXXX', name: 'Bob' });

    const result = await errorPromise;

    expect(result.message).toBe('Game not found');
  });

  it('prevents duplicate player names', async () => {
    // First player joins
    playerSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      playerSocket.on('connect', resolve);
      playerSocket.connect();
    });

    const joinedPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(playerSocket, 'player:joined');
    playerSocket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinedPromise;

    // Second player tries same name
    const player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    const errorPromise = waitFor<{ message: string }>(player2Socket, 'game:error');
    player2Socket.emit('game:join', { code: gameCode, name: 'Alice' });

    const result = await errorPromise;
    expect(result.message).toContain('already taken');

    player2Socket.disconnect();
  });

  it('broadcasts join to all players in the game', async () => {
    // First player joins
    playerSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      playerSocket.on('connect', resolve);
      playerSocket.connect();
    });

    const joinedPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(playerSocket, 'player:joined');
    playerSocket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinedPromise;

    // Second player joins - first player should be notified
    const player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    const hostNotificationPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(hostSocket, 'player:joined');

    const player1NotificationPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(playerSocket, 'player:joined');

    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });

    const [hostResult, player1Result] = await Promise.all([
      hostNotificationPromise,
      player1NotificationPromise,
    ]);

    expect(hostResult.player.name).toBe('Bob');
    expect(hostResult.players).toHaveLength(2);
    expect(player1Result.player.name).toBe('Bob');
    expect(player1Result.players).toHaveLength(2);

    player2Socket.disconnect();
  });
});

describe('Socket Handlers - Seat Selection', () => {
  let httpServer: HttpServer;
  let io: Server;
  let hostSocket: TypedClientSocket;
  let playerSocket: TypedClientSocket;
  let port: number;
  let gameCode: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);

      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'object' && address ? address.port : 3000;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    gameManager.reset();

    // Create host and game
    hostSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      hostSocket.on('connect', resolve);
      hostSocket.connect();
    });

    const gameCreatedPromise = waitFor<{
      gameCode: string;
      gameId: string;
      gameState: PublicGameState;
    }>(hostSocket, 'game:created');
    hostSocket.emit('game:create');
    const result = await gameCreatedPromise;
    gameCode = result.gameCode;

    // Join a player
    playerSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      playerSocket.on('connect', resolve);
      playerSocket.connect();
    });

    const joinedPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(playerSocket, 'player:joined');
    playerSocket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinedPromise;
  });

  afterEach(() => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (playerSocket?.connected) playerSocket.disconnect();
  });

  it('allows player to select a seat', async () => {
    const stateUpdatePromise = waitFor<{ gameState: PublicGameState }>(
      playerSocket,
      'state:update'
    );

    playerSocket.emit('seat:select', { seatIndex: 0 });

    const result = await stateUpdatePromise;

    expect(result.gameState.players[0].seatIndex).toBe(0);
  });

  it('broadcasts seat selection to all players', async () => {
    const hostUpdatePromise = waitFor<{ gameState: PublicGameState }>(hostSocket, 'state:update');

    playerSocket.emit('seat:select', { seatIndex: 2 });

    const result = await hostUpdatePromise;

    expect(result.gameState.players[0].seatIndex).toBe(2);
  });

  it('prevents selecting an occupied seat', async () => {
    // Alice selects seat 0
    const stateUpdatePromise = waitFor<{ gameState: PublicGameState }>(
      playerSocket,
      'state:update'
    );
    playerSocket.emit('seat:select', { seatIndex: 0 });
    await stateUpdatePromise;

    // Bob joins and tries same seat
    const player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    const joinedPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player2Socket, 'player:joined');
    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });
    await joinedPromise;

    const errorPromise = waitFor<{ message: string }>(player2Socket, 'game:error');
    player2Socket.emit('seat:select', { seatIndex: 0 });

    const result = await errorPromise;
    expect(result.message).toContain('already taken');

    player2Socket.disconnect();
  });
});

describe('Socket Handlers - Game Start', () => {
  let httpServer: HttpServer;
  let io: Server;
  let hostSocket: TypedClientSocket;
  let player1Socket: TypedClientSocket;
  let player2Socket: TypedClientSocket;
  let port: number;
  let gameCode: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);

      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'object' && address ? address.port : 3000;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    gameManager.reset();

    // Create host and game
    hostSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      hostSocket.on('connect', resolve);
      hostSocket.connect();
    });

    const gameCreatedPromise = waitFor<{
      gameCode: string;
      gameId: string;
      gameState: PublicGameState;
    }>(hostSocket, 'game:created');
    hostSocket.emit('game:create');
    const result = await gameCreatedPromise;
    gameCode = result.gameCode;
  });

  afterEach(() => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (player1Socket?.connected) player1Socket.disconnect();
    if (player2Socket?.connected) player2Socket.disconnect();
  });

  it('requires at least 2 players to start', async () => {
    const errorPromise = waitFor<{ message: string }>(hostSocket, 'game:error');

    hostSocket.emit('game:start');

    const result = await errorPromise;
    expect(result.message).toContain('at least 2 players');
  });

  it('requires all players to be seated before starting', async () => {
    // Add two players without seats
    player1Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player1Socket.on('connect', resolve);
      player1Socket.connect();
    });

    const join1Promise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player1Socket, 'player:joined');
    player1Socket.emit('game:join', { code: gameCode, name: 'Alice' });
    await join1Promise;

    player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    const join2Promise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player2Socket, 'player:joined');
    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });
    await join2Promise;

    // Try to start without seating
    const errorPromise = waitFor<{ message: string }>(hostSocket, 'game:error');
    hostSocket.emit('game:start');

    const result = await errorPromise;
    expect(result.message).toContain('must be seated');
  });

  it('starts game when all conditions are met', async () => {
    // Add and seat two players
    player1Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player1Socket.on('connect', resolve);
      player1Socket.connect();
    });

    let joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player1Socket, 'player:joined');
    player1Socket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinPromise;

    let seatPromise = waitFor<{ gameState: PublicGameState }>(player1Socket, 'state:update');
    player1Socket.emit('seat:select', { seatIndex: 0 });
    await seatPromise;

    player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player2Socket, 'player:joined');
    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });
    await joinPromise;

    seatPromise = waitFor<{ gameState: PublicGameState }>(player2Socket, 'state:update');
    player2Socket.emit('seat:select', { seatIndex: 1 });
    await seatPromise;

    // Start the game
    const gameStartedPromise = waitFor<{ gameState: PublicGameState }>(hostSocket, 'game:started');

    hostSocket.emit('game:start');

    const result = await gameStartedPromise;

    expect(result.gameState.phase).toBe('playing');
    expect(result.gameState.currentRound).toBe(1);
  });

  it('deals hands to players when game starts', async () => {
    // Add and seat two players
    player1Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player1Socket.on('connect', resolve);
      player1Socket.connect();
    });

    let joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player1Socket, 'player:joined');
    player1Socket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinPromise;

    let seatPromise = waitFor<{ gameState: PublicGameState }>(player1Socket, 'state:update');
    player1Socket.emit('seat:select', { seatIndex: 0 });
    await seatPromise;

    player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player2Socket, 'player:joined');
    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });
    await joinPromise;

    seatPromise = waitFor<{ gameState: PublicGameState }>(player2Socket, 'state:update');
    player2Socket.emit('seat:select', { seatIndex: 1 });
    await seatPromise;

    // Both players should receive hands
    const player1HandPromise = waitFor<{ hand: unknown[] }>(player1Socket, 'hand:dealt');
    const player2HandPromise = waitFor<{ hand: unknown[] }>(player2Socket, 'hand:dealt');

    hostSocket.emit('game:start');

    const [player1Hand, player2Hand] = await Promise.all([player1HandPromise, player2HandPromise]);

    // 2 players get 10 cards each
    expect(player1Hand.hand).toHaveLength(10);
    expect(player2Hand.hand).toHaveLength(10);
  });

  it('returns error when unrelated socket tries to start', async () => {
    // Add and seat two players
    player1Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player1Socket.on('connect', resolve);
      player1Socket.connect();
    });

    let joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player1Socket, 'player:joined');
    player1Socket.emit('game:join', { code: gameCode, name: 'Alice' });
    await joinPromise;

    let seatPromise = waitFor<{ gameState: PublicGameState }>(player1Socket, 'state:update');
    player1Socket.emit('seat:select', { seatIndex: 0 });
    await seatPromise;

    player2Socket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
      player2Socket.connect();
    });

    joinPromise = waitFor<{
      player: PublicPlayer;
      players: PublicPlayer[];
      gameState: PublicGameState;
    }>(player2Socket, 'player:joined');
    player2Socket.emit('game:join', { code: gameCode, name: 'Bob' });
    await joinPromise;

    seatPromise = waitFor<{ gameState: PublicGameState }>(player2Socket, 'state:update');
    player2Socket.emit('seat:select', { seatIndex: 1 });
    await seatPromise;

    // Unrelated socket (not in this game) tries to start
    const unrelatedSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      unrelatedSocket.on('connect', resolve);
      unrelatedSocket.connect();
    });

    const errorPromise = waitFor<{ message: string }>(unrelatedSocket, 'game:error');
    unrelatedSocket.emit('game:start');

    const result = await errorPromise;
    expect(result.message).toBe('Game not found');

    unrelatedSocket.disconnect();
  });
});

describe('Socket Handlers - Spectating', () => {
  let httpServer: HttpServer;
  let io: Server;
  let hostSocket: TypedClientSocket;
  let spectatorSocket: TypedClientSocket;
  let port: number;
  let gameCode: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);

      httpServer.listen(() => {
        const address = httpServer.address();
        port = typeof address === 'object' && address ? address.port : 3000;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    gameManager.reset();

    // Create host and game
    hostSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      hostSocket.on('connect', resolve);
      hostSocket.connect();
    });

    const gameCreatedPromise = waitFor<{
      gameCode: string;
      gameId: string;
      gameState: PublicGameState;
    }>(hostSocket, 'game:created');
    hostSocket.emit('game:create');
    const result = await gameCreatedPromise;
    gameCode = result.gameCode;
  });

  afterEach(() => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (spectatorSocket?.connected) spectatorSocket.disconnect();
  });

  it('allows spectating an existing game', async () => {
    spectatorSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      spectatorSocket.on('connect', resolve);
      spectatorSocket.connect();
    });

    const stateUpdatePromise = waitFor<{ gameState: PublicGameState }>(
      spectatorSocket,
      'state:update'
    );

    spectatorSocket.emit('game:spectate', { code: gameCode });

    const result = await stateUpdatePromise;

    expect(result.gameState.code).toBe(gameCode);
    expect(result.gameState.phase).toBe('lobby');
  });

  it('returns error when spectating invalid game code', async () => {
    spectatorSocket = ioc(`http://localhost:${port}`, { autoConnect: false });
    await new Promise<void>((resolve) => {
      spectatorSocket.on('connect', resolve);
      spectatorSocket.connect();
    });

    const errorPromise = waitFor<{ message: string }>(spectatorSocket, 'game:error');

    spectatorSocket.emit('game:spectate', { code: 'XXXX' });

    const result = await errorPromise;

    expect(result.message).toBe('Game not found');
  });
});
