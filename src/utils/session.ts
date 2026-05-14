import type { GameState } from '../types/game';

const SESSION_KEY = 'farkle_game_state';

export function saveSession(gameState: GameState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(gameState));
  } catch { /* quota exceeded — non-critical */ }
}

export function loadSession(): GameState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    // If the user refreshed mid-roll animation, the ROLL_COMPLETE action never
    // fired. Snap to 'selecting' so the turn can continue normally.
    if (saved.phase === 'rolling') {
      saved.phase = 'selecting';
    }
    return saved;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
