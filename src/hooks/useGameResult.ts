import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { GameState } from '../types/game';
import type { MatchRecord } from '../types/history';
import type { UserProfile } from '../types/player';
import { log } from '../lib/logger';

interface GameResultDeps {
  updateStats: (updater: (prev: UserProfile['stats']) => Partial<UserProfile['stats']>) => void;
  recordMatch: (record: MatchRecord) => Promise<{ error: string | null }>;
}

export function useGameResult(
  state: GameState,
  isOnlineMode: boolean,
  user: User | null,
  { updateStats, recordMatch }: GameResultDeps,
) {
  const resultAppliedRef = useRef(false);

  // Reset tracking when a new game starts
  useEffect(() => {
    resultAppliedRef.current = false;
  }, [state.startTime]);

  useEffect(() => {
    if (state.phase !== 'game-over' || state.winner === null) return;
    if (resultAppliedRef.current) return;
    resultAppliedRef.current = true;

    const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const winnerPlayer = state.players[state.winner];

    const humanPlayer = isOnlineMode
      ? (state.players.find((p) => p.id === user?.id) ?? null)
      : (state.players.find((p) => p.isHuman) ?? null);
    const humanWon =
      humanPlayer !== null && state.players[state.winner]?.id === humanPlayer.id;

    const record: MatchRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode: state.mode,
      players: state.players.map((p) => ({
        name: p.name,
        avatar: p.avatar,
        score: p.totalScore,
        isHuman: isOnlineMode ? p.id === user?.id : p.isHuman,
      })),
      winnerName: winnerPlayer?.name ?? 'Unknown',
      durationSeconds,
      targetScore: state.targetScore,
    };

    recordMatch(record).catch((err) => log.warn('Failed to save match record:', err));

    if (humanPlayer) {
      updateStats((prev) => ({
        gamesPlayed: (prev.gamesPlayed ?? 0) + 1,
        wins: (prev.wins ?? 0) + (humanWon ? 1 : 0),
        losses: (prev.losses ?? 0) + (humanWon ? 0 : 1),
        bestScore: Math.max(prev.bestScore ?? 0, humanPlayer.totalScore),
        totalPointsScored: (prev.totalPointsScored ?? 0) + humanPlayer.totalScore,
      }));
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps
}
