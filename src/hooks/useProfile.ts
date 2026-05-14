import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types/player';
import { getProfile, saveProfile } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => getProfile());

  // Sync to Supabase once anon auth resolves (powers leaderboard)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: profile.name,
        avatar: profile.avatar,
        stats: profile.stats,
      })
      .then(({ error }) => {
        if (error) log.warn('Profile sync to Supabase failed:', error.message);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback(
    async (updates: { name?: string; avatar?: string }): Promise<{ error: string | null }> => {
      const newName = updates.name ?? profile.name;
      const newAvatar = updates.avatar ?? profile.avatar;
      const updated: UserProfile = { ...profile, name: newName, avatar: newAvatar };

      saveProfile(updated);
      setProfile(updated);

      if (user) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          username: newName,
          avatar: newAvatar,
          stats: profile.stats,
        });
        if (error) return { error: error.message };
      }
      return { error: null };
    },
    [user, profile],
  );

  const updateStats = useCallback(
    (
      updater:
        | ((prev: UserProfile['stats']) => Partial<UserProfile['stats']>)
        | Partial<UserProfile['stats']>,
    ) => {
      setProfile((prev) => {
        const delta = typeof updater === 'function' ? updater(prev.stats) : updater;
        const newStats: UserProfile['stats'] = { ...prev.stats, ...delta };
        const updated: UserProfile = { ...prev, stats: newStats };

        saveProfile(updated);

        if (user) {
          supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: prev.name,
              avatar: prev.avatar,
              stats: newStats,
            })
            .then(({ error }) => {
              if (error) log.warn('Stats sync failed:', error.message);
            });
        }

        return updated;
      });
    },
    [user],
  );

  // profileLoading is always false — profile comes from localStorage synchronously
  return { profile, profileLoading: false, updateProfile, updateStats };
}
