import { useState, useEffect, useCallback } from 'react';
import type { MatchRecord } from '../types/history';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function rowToRecord(row: Record<string, unknown>): MatchRecord {
  return {
    id: row.id as string,
    date: row.date as string,
    mode: row.mode as MatchRecord['mode'],
    players: row.players as MatchRecord['players'],
    winnerName: row.winner_name as string,
    durationSeconds: row.duration_seconds as number,
    targetScore: row.target_score as number,
  };
}

export function useHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch match history from Supabase when user is known
  useEffect(() => {
    if (!user) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    supabase
      .from('match_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setHistory(data.map((row) => rowToRecord(row as Record<string, unknown>)));
        }
        setHistoryLoading(false);
      });
  }, [user]);

  // Insert a new match record
  const recordMatch = useCallback(
    async (record: MatchRecord): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('match_history')
        .insert({
          user_id: user.id,
          date: record.date,
          mode: record.mode,
          players: record.players,
          winner_name: record.winnerName,
          duration_seconds: record.durationSeconds,
          target_score: record.targetScore,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      if (data) {
        setHistory((prev) =>
          [rowToRecord(data as Record<string, unknown>), ...prev].slice(0, 50)
        );
      }
      return { error: null };
    },
    [user]
  );

  // Delete all history for the current user
  const wipeHistory = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('match_history')
      .delete()
      .eq('user_id', user.id);

    if (!error) setHistory([]);
  }, [user]);

  return { history, historyLoading, recordMatch, wipeHistory };
}
