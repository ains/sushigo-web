import { Game } from './Game.js';

export class GameManager {
  private games: Map<string, Game> = new Map();
  private codeToGameId: Map<string, string> = new Map();

  // Generate a unique 4-character game code
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.codeToGameId.has(code));
    return code;
  }

  // Create a new game
  createGame(hostSocketId: string): Game {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = this.generateCode();

    const game = new Game(gameId, code, hostSocketId);
    this.games.set(gameId, game);
    this.codeToGameId.set(code, gameId);

    return game;
  }

  // Get game by ID
  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  // Get game by code
  getGameByCode(code: string): Game | undefined {
    const gameId = this.codeToGameId.get(code.toUpperCase());
    return gameId ? this.games.get(gameId) : undefined;
  }

  // Get game by socket ID (finds game where player is connected)
  getGameBySocket(socketId: string): Game | undefined {
    for (const game of this.games.values()) {
      if (game.getPlayerBySocket(socketId)) {
        return game;
      }
      if (game.hostSocketId === socketId) {
        return game;
      }
    }
    return undefined;
  }

  // Remove a game
  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      this.codeToGameId.delete(game.code);
      this.games.delete(gameId);
    }
  }

  // Clean up empty/old games
  cleanup(): void {
    const now = Date.now();
    for (const [gameId, game] of this.games) {
      // Remove games with no players or in lobby for too long
      if (game.playerCount === 0) {
        this.removeGame(gameId);
      }
    }
  }

  // Reset all state (for testing)
  reset(): void {
    this.games.clear();
    this.codeToGameId.clear();
  }
}

// Singleton instance
export const gameManager = new GameManager();
