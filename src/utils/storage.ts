import type { UserProfile } from '../types/player';
import type { MatchRecord } from '../types/history';
import { DEFAULT_PROFILE } from '../types/player';

const KEYS = {
  PROFILE: 'farkle_profile',
  HISTORY: 'farkle_history',
} as const;

const MAX_HISTORY = 50;

// --- Profile ---

export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return { ...DEFAULT_PROFILE, id: crypto.randomUUID() };
    return JSON.parse(raw) as UserProfile;
  } catch {
    return { ...DEFAULT_PROFILE, id: crypto.randomUUID() };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// --- History ---

export function getHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchRecord[];
  } catch {
    return [];
  }
}

export function addMatch(record: MatchRecord): void {
  const history = getHistory();
  history.unshift(record); // newest first
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}
