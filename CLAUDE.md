# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chesskit is an open-source chess analysis web application (AGPL-3.0). Users can load games from chess.com/lichess, analyze positions with Stockfish (running client-side via WebAssembly/Web Workers), play against the engine, and store games locally in IndexedDB.

## Commands

```bash
npm run dev          # Start dev server (Next.js with Turbo) on localhost:3000
npm run build        # Production build (static export)
npm run lint         # ESLint + TypeScript type-check (tsc --noEmit)
npm start            # Start production server
```

There is no test suite. Quality checks are `npm run lint` only.

## Architecture

**Stack**: Next.js 15 (Pages Router, static export) + React 18 + TypeScript + Material UI + Jotai

**Path alias**: `@/*` maps to `src/*`

### Key Architectural Layers

**Pages** (`src/pages/`): Three routes — analysis (index), play, and database. `_app.tsx` wraps everything with React Query provider and layout.

**Sections** (`src/sections/`): Feature modules, each with its own components. Main sections: `analysis/` (game review board + panels), `play/` (play vs Stockfish), `loadGame/` (import dialogs), `engineSettings/`, `layout/` (nav + theme).

**State** (`src/sections/analysis/states.ts`): All global state uses Jotai atoms. Key atoms: `gameAtom` (full game Chess instance), `boardAtom` (current position), `gameEvalAtom` (engine evaluation results), `engineNameAtom`, `engineDepthAtom`, `engineMultiPvAtom`, `evaluationProgressAtom`.

**Engine** (`src/lib/engine/`): UCI protocol implementation for Stockfish running in Web Workers.
- `uciEngine.ts` — main engine class handling UCI communication
- `worker.ts` — Web Worker pool management
- `helpers/` — move classification, accuracy calculation, win percentage, ELO estimation
- Multiple Stockfish versions supported (11, 16, 16.1, 17, plus "lite" variants)
- SharedArrayBuffer required — CORS headers configured in `next.config.ts`

**Chess logic** (`src/lib/chess.ts`): Wraps `chess.js` for PGN parsing, move validation, position utilities.

**API integrations** (`src/lib/chessCom.ts`, `src/lib/lichess.ts`): Fetch user games from external platforms. Lichess uses NDJSON streaming.

**Types** (`src/types/`): Core enums in `enums.ts` — `GameOrigin` (pgn/chesscom/lichess), `EngineName`, `MoveClassification` (Blunder through Splendid), `Color`. Game/player interfaces in `game.ts`, eval types in `eval.ts`.

**Data** (`src/data/openings.ts`): Opening names database for position identification.

### Client-Side Only

Everything runs in the browser. No server-side API routes. Production build is a fully static export (`output: "export"` in next.config.ts) deployed to AWS S3. Game storage uses IndexedDB via the `idb` library.

## Code Style

- Double quotes, semicolons, trailing commas (ES5), 2-space indentation (Prettier)
- ESLint extends: Next.js, TypeScript, Prettier, TanStack Query, import plugin
- Strict TypeScript (`noUnusedLocals`, `noUnusedParameters`)
- Conventional commit prefixes: `feat`, `fix`, `design`, `chore`
