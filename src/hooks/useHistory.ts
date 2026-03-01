import { useState, useCallback } from 'react';
import type { MatchRecord } from '../types/history';
import { getHistory, addMatch, clearHistory } from '../utils/storage';

export function useHistory() {
  const [history, setHistory] = useState<MatchRecord[]>(getHistory);

  const recordMatch = useCallback((record: MatchRecord) => {
    addMatch(record);
    setHistory(getHistory());
  }, []);

  const wipeHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, recordMatch, wipeHistory };
}
