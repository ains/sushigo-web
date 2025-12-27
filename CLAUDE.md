# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sushi Go! is a multiplayer web implementation of the card game, designed for local play across multiple devices (tablet as host, mobile phones for players, optional TV display).

## Commands

```bash
# Development (runs both client and server with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test              # Run shared package tests once
npm run test:watch    # Run tests in watch mode

# Formatting
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting (CI)

# Individual package development
npm run dev:client    # Vite dev server on port 5173
npm run dev:server    # tsx watch on port 3000
```

## Architecture

### Multi-Device Setup

- **Tablet/Spectator** (`/tablet`): Creates game, shows QR code, displays game board and scores
- **Mobile/Player** (`/mobile/:code`): Players join via QR code, select seats, play cards
- **TV/Spectator** (`/tv/:code`): Large display view for streaming/spectating
- **Debug** (`/debug`): Testing interface with mock game states

### Monorepo Structure

```
client/          # React 18 + Vite + TypeScript frontend
server/          # Express + Socket.IO backend
shared/          # Shared components between the client / server (types and scoring)
```

### Real-Time Communication

Socket.IO handles all game events. Key event flow:

1. Host creates game → receives game code
2. Players join via code → select seats
3. Host starts game → cards dealt
4. Players select cards → all reveal simultaneously
5. Hands rotate → repeat until round ends
6. Score calculation → next round or game end

### Shared Package (`shared/src/`)

- `index.ts`: Shared types (Card, GamePhase, PublicPlayer, PublicGameState, Socket events)
- `scoring.ts`: All scoring logic (tempura, sashimi, dumplings, maki, nigiri, wasabi, pudding)
- `scoring.test.ts`: Vitest test suite for scoring functions

### Server Structure (`server/src/`)

- `game/Game.ts`: Core state machine (lobby → playing → round_end → game_end)
- `game/GameManager.ts`: Singleton managing all active games
- `socket/handlers.ts`: Socket event handlers for all game actions

### Client Structure (`client/src/`)

- `context/GameContext.tsx`: React Context + Socket.IO client state management
- `components/tablet/`: Host view components
- `components/mobile/`: Player view components
- `components/tv/`: Spectator view components
- `components/shared/`: Reusable Card component

## Game Rules Implementation

- 3 rounds, 2-4 players
- Card types: Tempura, Sashimi, Dumpling, Maki (1/2/3), Nigiri (Egg/Salmon/Squid), Wasabi, Pudding, Chopsticks
- Chopsticks allow selecting 2 cards per turn
- Maki uses comparative across a single round (most/least across players)
- Pudding uses comparative scoring across the entire game (most/least across players)
- Wasabi triples the next Nigiri played

## Development Notes

- Server serves built client from `/client/dist` in production
- Development uses Vite proxy for Socket.IO WebSocket connections
- TypeScript strict mode enabled throughout
- Shared types and scoring logic are in the `shared` package (`sushigo-shared`)
- Prettier is used for code formatting (config in `.prettierrc`)
