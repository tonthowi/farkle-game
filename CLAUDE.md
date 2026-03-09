# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test runner is configured.

## Environment Setup

Copy `.env.example` → `.env` and fill in Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

The app degrades gracefully when Supabase is unconfigured (`isSupabaseConfigured` flag in `src/lib/supabase.ts`).

To set up the database, run `supabase/schema.sql` in the Supabase SQL editor (idempotent, safe to re-run).

## Architecture

**Stack:** React 19 + TypeScript + Vite, Tailwind CSS, Framer Motion, Supabase (auth + DB + realtime), React Router v7.

### Game Modes
- `vs-computer` — single device vs AI opponent
- `local-multiplayer` — two humans on one device (pass-device prompts between turns)
- `online-multiplayer` — two players across devices via Supabase Realtime broadcast

### Core Data Flow

```
src/types/game.ts          ← all shared types (GameState, Die, TurnPhase, etc.)
src/game/engine.ts         ← pure gameReducer(state, action) → state
src/game/scoring.ts        ← calculateScore, hasScoringDice, getBestScoringSubset
src/game/dice.ts           ← createDice, rollDice, lockSelectedDice, etc.
src/game/constants.ts      ← WIN_SCORE, NUM_DICE, timing constants
src/hooks/useGame.ts       ← useReducer wrapper; AI automation via useEffect; exposes action dispatchers
src/pages/Game.tsx         ← orchestrates useGame + Supabase realtime channel for online sync
```

**Turn phases** (`TurnPhase`): `idle` → `rolling` → `selecting` → `farkled` | `hot-dice` → `idle` (next player) or `game-over`.

**Online multiplayer sync:** The active player dispatches local actions, then broadcasts the full `GameState` via a Supabase Realtime channel (`room:<roomCode>`). The opponent receives `SYNC_REMOTE_STATE` to mirror the state. The host sets `game_state` in the `rooms` table when starting; turn ownership is determined by matching `player.id` to `user.id`.

### AI System
`src/ai/strategies.ts` — three strategy functions (easy/medium/hard) called from `useGame`'s `useEffect` when it's the AI's turn. Each strategy uses `getBestScoringSubset` to identify scoring dice, then decides bank vs. roll-more based on thresholds or expected-value calculation (hard difficulty).

### Auth
`src/contexts/AuthContext.tsx` wraps Supabase auth (email/password, anonymous sign-in). `isGuest` is derived from `session.user.is_anonymous`. All routes except `/login` and `/signup` are protected via `ProtectedRoute`. Guest users can play but match history is not saved.

### Supabase Tables
- `profiles` — one row per user (username, avatar, stats jsonb). Auto-created on signup via DB trigger.
- `match_history` — one row per completed game per user. Not recorded for anonymous users.
- `rooms` — one row per online multiplayer room. Realtime enabled. Cleaned up on game-over.

### Styling
Custom Tailwind theme in `tailwind.config.js`: color palettes `wood`, `felt`, `gold`, `parchment`, `danger`, `dice`. Fonts: `Cinzel` (headings/UI), `Inter` (body). Animations: `shake`, `float`, `pulse-gold`, `fade-in`, `slide-up`.

### Key Hooks
- `useGame` — game logic and AI automation
- `useProfile` — read/write Supabase `profiles`
- `useHistory` — read/write Supabase `match_history`
- `useBgm` — background music mute toggle (paused during gameplay)
