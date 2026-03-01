import { useState, useCallback } from 'react';
import type { UserProfile } from '../types/player';
import { getProfile, saveProfile } from '../utils/storage';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(getProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const updateStats = useCallback(
    (updater: ((prev: UserProfile['stats']) => Partial<UserProfile['stats']>) | Partial<UserProfile['stats']>) => {
      setProfile((prev) => {
        const delta = typeof updater === 'function' ? updater(prev.stats) : updater;
        const updated: UserProfile = {
          ...prev,
          stats: { ...prev.stats, ...delta },
        };
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  return { profile, updateProfile, updateStats };
}
