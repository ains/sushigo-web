import { Card, GameState, Player, GamePhase, PublicGameState, PublicPlayer, CARDS_PER_PLAYER } from '../types/index.js';
import { Deck } from './Deck.js';
import { scorePlayerRound, scoreMakiForPlayers, scorePuddingsForPlayers, countPuddingsInCards } from './scoring.js';

export class Game {
  private state: GameState;
  private deck: Deck;
  private hands: Map<string, Card[]> = new Map(); // Original hands for rotation

  constructor(gameId: string, code: string, hostSocketId: string) {
    this.deck = new Deck();
    this.state = {
      id: gameId,
      code,
      phase: 'lobby',
      players: [],
      hostSocketId,
      currentRound: 0,
      currentTurn: 0,
      maxPlayers: 4,
      cardsPerHand: 0
    };
  }

  // Add a player to the game
  addPlayer(socketId: string, name: string): Player | null {
    if (this.state.phase !== 'lobby') {
      return null;
    }

    if (this.state.players.length >= this.state.maxPlayers) {
      return null;
    }

    // Check for duplicate names
    if (this.state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return null;
    }

    const player: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      socketId,
      name,
      hand: [],
      playedCards: [[], [], []], // 3 rounds
      selectedCards: [],
      hasConfirmed: false,
      score: 0,
      puddings: 0,
      isConnected: true,
      seatIndex: null
    };

    this.state.players.push(player);
    return player;
  }

  // Remove a player from the game
  removePlayer(socketId: string): boolean {
    const index = this.state.players.findIndex(p => p.socketId === socketId);
    if (index === -1) return false;

    if (this.state.phase === 'lobby') {
      this.state.players.splice(index, 1);
    } else {
      // During game, mark as disconnected
      this.state.players[index].isConnected = false;
    }
    return true;
  }

  // Reconnect a player
  reconnectPlayer(playerId: string, newSocketId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;

    player.socketId = newSocketId;
    player.isConnected = true;
    return true;
  }

  // Select a seat for a player
  selectSeat(socketId: string, seatIndex: number): boolean {
    if (this.state.phase !== 'lobby') return false;
    if (seatIndex < 0 || seatIndex > 3) return false;

    const player = this.getPlayerBySocket(socketId);
    if (!player) return false;

    // Check if seat is already taken by another player
    const seatTaken = this.state.players.some(
      p => p.id !== player.id && p.seatIndex === seatIndex
    );
    if (seatTaken) return false;

    player.seatIndex = seatIndex;
    return true;
  }

  // Check if all players are seated
  allPlayersSeated(): boolean {
    return this.state.players.every(p => p.seatIndex !== null);
  }

  // Start the game
  start(): boolean {
    if (this.state.phase !== 'lobby') return false;
    if (this.state.players.length < 2) return false;
    if (!this.allPlayersSeated()) return false;

    this.state.phase = 'playing';
    this.state.currentRound = 1;
    this.state.currentTurn = 1;
    this.state.cardsPerHand = CARDS_PER_PLAYER[this.state.players.length] || 8;

    this.startRound();
    return true;
  }

  // Start a new round
  private startRound(): void {
    this.deck.reset();

    // Deal cards to each player
    for (const player of this.state.players) {
      player.hand = this.deck.deal(this.state.cardsPerHand);
      player.selectedCards = [];
      player.hasConfirmed = false;
    }

    // Store original hands for rotation tracking
    this.hands.clear();
    for (const player of this.state.players) {
      this.hands.set(player.id, [...player.hand]);
    }

    this.state.currentTurn = 1;
  }

  // Player selects card(s)
  selectCards(socketId: string, cardIds: string[]): boolean {
    const player = this.getPlayerBySocket(socketId);
    if (!player) return false;
    if (this.state.phase !== 'playing') return false;

    // Validate cards are in player's hand
    const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
    if (selectedCards.length !== cardIds.length) return false;

    // Check if using chopsticks (can select 2 cards)
    const hasChopsticks = player.playedCards[this.state.currentRound - 1]
      .some(c => c.type === 'chopsticks');

    if (cardIds.length === 2 && !hasChopsticks) return false;
    if (cardIds.length > 2) return false;
    if (cardIds.length === 0) return false;

    player.selectedCards = selectedCards;
    return true;
  }

  // Player confirms their selection
  confirmSelection(socketId: string): boolean {
    const player = this.getPlayerBySocket(socketId);
    if (!player) return false;
    if (player.selectedCards.length === 0) return false;

    player.hasConfirmed = true;
    return true;
  }

  // Check if all players have confirmed
  allPlayersConfirmed(): boolean {
    return this.state.players
      .filter(p => p.isConnected)
      .every(p => p.hasConfirmed);
  }

  // Reveal all selected cards and process turn
  revealCards(): { playerId: string; cards: Card[] }[] {
    const revealed: { playerId: string; cards: Card[] }[] = [];

    for (const player of this.state.players) {
      if (!player.isConnected) continue;

      const selectedCards = [...player.selectedCards];
      revealed.push({ playerId: player.id, cards: selectedCards });

      // Add selected cards to played cards for this round
      player.playedCards[this.state.currentRound - 1].push(...selectedCards);

      // Count puddings
      player.puddings += countPuddingsInCards(selectedCards);

      // Remove selected cards from hand
      player.hand = player.hand.filter(c => !selectedCards.some(sc => sc.id === c.id));

      // If player used chopsticks (played 2 cards), return chopsticks to hand
      if (selectedCards.length === 2) {
        const chopsticksIndex = player.playedCards[this.state.currentRound - 1]
          .findIndex(c => c.type === 'chopsticks');
        if (chopsticksIndex !== -1) {
          const chopsticks = player.playedCards[this.state.currentRound - 1].splice(chopsticksIndex, 1)[0];
          player.hand.push(chopsticks);
        }
      }

      // Reset for next turn
      player.selectedCards = [];
      player.hasConfirmed = false;
    }

    return revealed;
  }

  // Pass hands to next player (clockwise)
  passHands(): void {
    const players = this.state.players.filter(p => p.isConnected);
    if (players.length < 2) return;

    // Alternate direction each round (clockwise on odd rounds, counter on even)
    const clockwise = this.state.currentRound % 2 === 1;

    const hands = players.map(p => p.hand);

    if (clockwise) {
      // Last player's hand goes to first player
      const lastHand = hands.pop()!;
      hands.unshift(lastHand);
    } else {
      // First player's hand goes to last player
      const firstHand = hands.shift()!;
      hands.push(firstHand);
    }

    for (let i = 0; i < players.length; i++) {
      players[i].hand = hands[i];
    }
  }

  // Process end of turn
  processTurn(): 'continue' | 'round_end' | 'game_end' {
    this.passHands();
    this.state.currentTurn++;

    // Check if round is over (all cards played)
    const firstPlayer = this.state.players.find(p => p.isConnected);
    if (!firstPlayer || firstPlayer.hand.length === 0) {
      return this.endRound();
    }

    return 'continue';
  }

  // End the current round
  private endRound(): 'round_end' | 'game_end' {
    // Score the round
    this.scoreRound();

    if (this.state.currentRound >= 3) {
      return this.endGame();
    }

    this.state.phase = 'round_end';
    return 'round_end';
  }

  // Start next round
  startNextRound(): void {
    this.state.currentRound++;
    this.state.phase = 'playing';

    // Clear played cards except puddings (which are tracked separately)
    for (const player of this.state.players) {
      player.playedCards[this.state.currentRound - 1] = [];
    }

    this.startRound();
  }

  // Score the round
  private scoreRound(): void {
    const round = this.state.currentRound;

    // Score individual player cards
    for (const player of this.state.players) {
      player.score += scorePlayerRound(player, round);
    }

    // Score maki (comparative)
    const makiScores = scoreMakiForPlayers(this.state.players, round);
    for (const [playerId, score] of makiScores) {
      const player = this.state.players.find(p => p.id === playerId);
      if (player) player.score += score;
    }
  }

  // End the game
  private endGame(): 'game_end' {
    // Score puddings
    const puddingScores = scorePuddingsForPlayers(this.state.players);
    for (const [playerId, score] of puddingScores) {
      const player = this.state.players.find(p => p.id === playerId);
      if (player) player.score += score;
    }

    this.state.phase = 'game_end';
    return 'game_end';
  }

  // Get round scores for display
  getRoundScores(): { playerId: string; roundScore: number; totalScore: number }[] {
    return this.state.players.map(p => ({
      playerId: p.id,
      roundScore: scorePlayerRound(p, this.state.currentRound),
      totalScore: p.score
    }));
  }

  // Get final scores
  getFinalScores(): { playerId: string; totalScore: number; puddings: number }[] {
    return this.state.players
      .map(p => ({
        playerId: p.id,
        totalScore: p.score,
        puddings: p.puddings
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  // Get winner
  getWinner(): string {
    const scores = this.getFinalScores();
    return scores[0]?.playerId || '';
  }

  // Get player by socket ID
  getPlayerBySocket(socketId: string): Player | undefined {
    return this.state.players.find(p => p.socketId === socketId);
  }

  // Get player by player ID
  getPlayerById(playerId: string): Player | undefined {
    return this.state.players.find(p => p.id === playerId);
  }

  // Get player's hand
  getPlayerHand(socketId: string): Card[] {
    const player = this.getPlayerBySocket(socketId);
    return player?.hand || [];
  }

  // Convert player to public info
  private toPublicPlayer(player: Player): PublicPlayer {
    return {
      id: player.id,
      name: player.name,
      playedCards: player.playedCards,
      score: player.score,
      puddings: player.puddings,
      hasConfirmed: player.hasConfirmed,
      isConnected: player.isConnected,
      handSize: player.hand.length,
      seatIndex: player.seatIndex
    };
  }

  // Get public game state (for broadcasting)
  getPublicState(): PublicGameState {
    return {
      id: this.state.id,
      code: this.state.code,
      phase: this.state.phase,
      players: this.state.players.map(p => this.toPublicPlayer(p)),
      currentRound: this.state.currentRound,
      currentTurn: this.state.currentTurn,
      maxPlayers: this.state.maxPlayers
    };
  }

  // Getters
  get id(): string { return this.state.id; }
  get code(): string { return this.state.code; }
  get phase(): GamePhase { return this.state.phase; }
  get hostSocketId(): string { return this.state.hostSocketId; }
  get playerCount(): number { return this.state.players.length; }
  get players(): Player[] { return this.state.players; }

  // Restart the game
  restart(): void {
    for (const player of this.state.players) {
      player.hand = [];
      player.playedCards = [[], [], []];
      player.selectedCards = [];
      player.hasConfirmed = false;
      player.score = 0;
      player.puddings = 0;
    }

    this.state.phase = 'lobby';
    this.state.currentRound = 0;
    this.state.currentTurn = 0;
  }
}
