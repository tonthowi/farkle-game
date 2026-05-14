# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite HMR dev server → http://127.0.0.1:5173
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test runner is configured.

## Environment Setup

Copy `.env.example` → `.env` and fill in Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

The app degrades gracefully when Supabase is unconfigured (`isSupabaseConfigured` flag in `src/lib/supabase.ts` — online features disabled, local play still works).

To set up the database, run `supabase/schema.sql` in the Supabase SQL editor (idempotent, safe to re-run).

## Architecture

**Stack:** React 19 + TypeScript + Vite, Tailwind CSS, Framer Motion, Supabase (anon auth + PostgreSQL + Realtime), React Router v7. **Deployed on Vercel** — `vercel.json` rewrites all routes to `index.html`.

### Auth model — no login UI

All routes are public. There is no `/login` page, no `ProtectedRoute`, and no email/magic link flow.

On app load, `src/contexts/AuthContext.tsx` calls `supabase.auth.signInAnonymously()` silently if no session exists. This gives every device a stable `user.id` used for:
- Online multiplayer room ownership (`rooms.host_id` / `rooms.guest_id`)
- Supabase `profiles` upsert (background sync, powers leaderboard)
- `match_history` inserts (RLS allows anon users since they have a real `user.id`)

`AuthContextValue`:
```typescript
{ session: Session | null; user: User | null; loading: boolean; signOut: () => Promise<void> }
```

`signOut()` clears `localStorage` profile + gets a fresh anonymous session, which triggers `WelcomeModal` on the next Home visit.

### First-run identity (WelcomeModal)

`Home.tsx` checks `localStorage.getItem('farkle_profile')` on mount. If missing (first visit), it renders `<WelcomeModal>` as a full-screen overlay. The user sets a name and avatar, which are saved to `localStorage`. File: `src/components/ui/WelcomeModal.tsx`.

### Data layer

**Profile — localStorage-first:**
- Source of truth: `localStorage` key `farkle_profile` (serialized `UserProfile`)
- Helper functions: `getProfile()` / `saveProfile()` in `src/utils/storage.ts`
- `useProfile` hook (`src/hooks/useProfile.ts`) reads synchronously on init — `profileLoading` is always `false`
- After anon auth resolves, profile is upserted to Supabase `profiles` table in the background (powers leaderboard only)
- `updateProfile({name?, avatar?})` and `updateStats(updater)` write to localStorage first, then sync to Supabase

**Match history — Supabase:**
- Stored in `match_history` table; fetched by `user_id`
- `useHistory` hook (`src/hooks/useHistory.ts`) handles fetch + insert + wipe
- Written on game-over via `useGameResult` hook (`src/hooks/useGameResult.ts`)

**Session persistence — sessionStorage:**
- Active `GameState` is saved to `sessionStorage` on every state change (browser-refresh-safe)
- Restored in `Game.tsx` when `locationState` is missing
- Helpers: `saveSession` / `loadSession` / `clearSession` in `src/utils/session.ts`

**localStorage keys:**
| Key | Content |
|---|---|
| `farkle_profile` | `UserProfile` JSON |
| `farkle_history` | `MatchRecord[]` JSON (max 50, newest first) |

### Core game data flow

```
src/types/game.ts      ← GameState, Die, TurnPhase, GameMode, GameAction, NewGamePayload
src/game/engine.ts     ← gameReducer(state, action) → state  (pure, no side effects)
src/game/scoring.ts    ← calculateScore, hasScoringDice, getBestScoringSubset
src/game/dice.ts       ← createDice, rollDice, lockSelectedDice
src/game/constants.ts  ← WIN_SCORE=10000, TURN_TIME_LIMIT_MS=30000, animation delay constants
src/hooks/useGame.ts   ← useReducer wrapper; AI automation via useEffect; exposes action dispatchers
src/pages/Game.tsx     ← orchestrates useGame + online sync + SFX + session persistence
```

**Turn phase machine:**
```
idle → rolling → selecting → farkled      → idle (next player)
                           → hot-dice     → idle (same player, roll all 6)
                           → game-over
```

**Reducer actions:** `ROLL`, `ROLL_MORE`, `ROLL_COMPLETE`, `SELECT_DIE`, `BANK`, `CONFIRM_FARKLE`, `CONFIRM_HOT_DICE`, `CONFIRM_PASS`, `NEW_GAME`, `SYNC_REMOTE_STATE`

### Game modes

| Mode | Description |
|---|---|
| `vs-computer` | Single device vs AI opponent (Easy / Medium / Hard) |
| `local-multiplayer` | Pass & Play — two humans on one device. Pass-device modal gates screen between turns. |
| `online-multiplayer` | Two players across devices via Supabase Realtime broadcast |

**Online multiplayer sync:** The active player dispatches actions locally, then broadcasts the full `GameState` via a Supabase Realtime channel (`room:<roomCode>`). The opponent receives `SYNC_REMOTE_STATE` to mirror the state. The host writes `game_state` to the `rooms` table on game start. Turn ownership is determined by `player.id === user.id`.

**Turn timer (online only):** `TURN_TIME_LIMIT_MS = 30_000`. `GameState.turnDeadline` is set on `ROLL_COMPLETE` and cleared on `BANK` / `CONFIRM_FARKLE` / `CONFIRM_HOT_DICE`. The active player's client auto-acts on expiry; opponent clients ignore the timer.

### Key types

```typescript
type TurnPhase = 'idle' | 'rolling' | 'selecting' | 'farkled' | 'hot-dice' | 'game-over'
type GameMode  = 'vs-computer' | 'local-multiplayer' | 'online-multiplayer'
type Difficulty = 'easy' | 'medium' | 'hard'
type DieValue   = 1 | 2 | 3 | 4 | 5 | 6

interface Die { id: number; value: DieValue; isSelected: boolean; isLocked: boolean; isRolling: boolean }

interface PlayerState { id: string; name: string; avatar: string; totalScore: number; isHuman: boolean }

interface GameState {
  phase: TurnPhase; currentPlayerIndex: number; players: PlayerState[];
  dice: Die[]; turnScore: number; selectedScore: number; rollCount: number;
  mode: GameMode; difficulty?: Difficulty; targetScore: number;
  winner: number | null; startTime: number; showPassDevice: boolean;
  roomCode?: string; turnDeadline: number | null;
}

interface PlayerStats {
  gamesPlayed: number; wins: number; losses: number;
  bestScore: number; totalPointsScored: number; totalFarkles: number;
}
interface UserProfile { id: string; name: string; avatar: string; stats: PlayerStats }
```

### AI system

`src/ai/strategies.ts` — three strategy functions called from `useGame`'s `useEffect` when it's the AI's turn:
- **`easyStrategy`** — selects all scoring dice, banks at ≥300 pts or ≤2 dice left
- **`mediumStrategy`** — banks at ≥600 pts (adjusts threshold when opponent is near win), ≤2 dice left
- **`hardStrategy`** — expected-value calculation using farkle probability and expected-gain tables

All strategies call `getBestScoringSubset` from `src/game/scoring.ts` to identify the optimal dice subset to select. AI moves are delayed: `AI_SELECT_DELAY_MS = 700`, `AI_MOVE_DELAY_MS = 1200`.

### Sound effects

`src/hooks/useSfx.ts` — Web Audio API synthesis (zero audio files). Five synthesized sounds:
- `playRoll` — noise burst
- `playSelect` — tick
- `playBank` — rising chord
- `playFarkle` — descending glide
- `playWin` — fanfare

Called in `Game.tsx` action handlers, layered on top of game logic. No mute toggle (BGM was removed).

### Styling

Custom Tailwind theme (`tailwind.config.js`):
- **Colors:** `wood` (dark browns — backgrounds), `felt` (greens), `gold` (yellows — accents), `parchment` (creams — text), `danger` (reds — errors/farkle), `dice` (`face` / `pip` / `border`)
- **Fonts:** `font-cinzel` → Cinzel serif (headings, UI labels, all game text), `font-body` → Inter (small body copy)
- **Animations:** `shake` · `float` · `pulse-gold` · `fade-in` · `slide-up`

### Supabase tables

- **`profiles`** — one row per user (`id`, `username`, `avatar`, `stats` jsonb). Auto-created via DB trigger on `auth.users` insert. RLS: authenticated users can read all; own row write.
- **`match_history`** — one row per completed game (`user_id`, `mode`, `players` jsonb, `winner_name`, `duration_seconds`, `target_score`). RLS: own-row CRUD. Anonymous users can insert (they have a real `user.id`).
- **`rooms`** — online multiplayer rooms (`code` unique 6-char, `host_id`, `guest_id`, `status`, `target_score`, `game_state` jsonb). Realtime enabled. Cleaned up by host on cancel; stale room cleanup requires a manual cron job or Supabase Edge Function.

### Routes

```
/              Home — mode select, profile peek, quick rules, WelcomeModal on first visit
/setup         Game setup — AI difficulty, Player 2 name, target score
/game          Active game — dice board, score panel, turn actions
/lobby         Online room join/create
/profile       Profile editor — name + avatar (all users, no auth gate)
/history       Match history (Supabase)
/leaderboard   Top 20 players by wins (Supabase)
```

### Key hooks

| Hook | File | Purpose |
|---|---|---|
| `useGame` | `src/hooks/useGame.ts` | Game reducer + AI automation |
| `useOnlineSync` | `src/hooks/useOnlineSync.ts` | Supabase Realtime channel + broadcast |
| `useGameResult` | `src/hooks/useGameResult.ts` | Stats update + match record on game-over |
| `useProfile` | `src/hooks/useProfile.ts` | localStorage-first profile read/write |
| `useHistory` | `src/hooks/useHistory.ts` | Supabase match_history CRUD |
| `useSfx` | `src/hooks/useSfx.ts` | Web Audio API sound effects |
