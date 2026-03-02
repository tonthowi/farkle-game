import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types/player';
import { DEFAULT_PROFILE } from '../types/player';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    ...DEFAULT_PROFILE,
    id: user?.id ?? '',
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile from Supabase when user is known
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile({
            id: data.id as string,
            name: data.username as string,
            avatar: data.avatar as string,
            stats: data.stats as UserProfile['stats'],
          });
        }
        setProfileLoading(false);
      });
  }, [user]);

  // Update username and/or avatar
  const updateProfile = useCallback(
    async (updates: { name?: string; avatar?: string }) => {
      if (!user) return;

      const dbUpdates: Record<string, string> = {};
      if (updates.name !== undefined) dbUpdates.username = updates.name;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => ({
          ...prev,
          ...(updates.name !== undefined && { name: updates.name! }),
          ...(updates.avatar !== undefined && { avatar: updates.avatar! }),
        }));
      }
    },
    [user]
  );

  // Update stats — optimistic local update + background Supabase sync
  const updateStats = useCallback(
    (
      updater:
        | ((prev: UserProfile['stats']) => Partial<UserProfile['stats']>)
        | Partial<UserProfile['stats']>
    ) => {
      if (!user) return;

      setProfile((prev) => {
        const delta = typeof updater === 'function' ? updater(prev.stats) : updater;
        const newStats: UserProfile['stats'] = { ...prev.stats, ...delta };

        // Fire-and-forget: write updated stats to Supabase in background
        supabase
          .from('profiles')
          .update({ stats: newStats })
          .eq('id', user.id)
          .then(() => {});

        return { ...prev, stats: newStats };
      });
    },
    [user]
  );

  return { profile, profileLoading, updateProfile, updateStats };
}
