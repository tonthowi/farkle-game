import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types/player';
import { DEFAULT_PROFILE } from '../types/player';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
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
      .then(async ({ data, error }) => {
        if (data) {
          setProfile({
            id: data.id as string,
            name: data.username as string,
            avatar: data.avatar as string,
            stats: data.stats as UserProfile['stats'],
          });
        } else if (error?.code === 'PGRST116') {
          // No row found — create a default profile so future saves work
          const defaultUsername =
            user.user_metadata?.username ??
            user.email?.split('@')[0] ??
            'Traveller';
          const defaultAvatar = user.user_metadata?.avatar ?? '🎲';
          const { data: inserted } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: defaultUsername,
              avatar: defaultAvatar,
              stats: DEFAULT_PROFILE.stats,
            })
            .select()
            .single();
          if (inserted) {
            setProfile({
              id: inserted.id as string,
              name: inserted.username as string,
              avatar: inserted.avatar as string,
              stats: inserted.stats as UserProfile['stats'],
            });
          }
        }
        setProfileLoading(false);
      });
  }, [user]);

  // Update username and/or avatar — uses upsert so it works even if no row exists
  const updateProfile = useCallback(
    async (updates: { name?: string; avatar?: string }): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };

      const newName = updates.name ?? profile.name;
      const newAvatar = updates.avatar ?? profile.avatar;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: newName,
        avatar: newAvatar,
        stats: profile.stats,
      });

      if (error) {
        return { error: error.message };
      }

      setProfile((prev) => ({ ...prev, name: newName, avatar: newAvatar }));
      return { error: null };
    },
    [user, profile.name, profile.avatar, profile.stats]
  );

  // Update stats — optimistic local update + background Supabase upsert
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

        // Fire-and-forget: upsert so it works even if no row exists
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

        return { ...prev, stats: newStats };
      });
    },
    [user]
  );

  return { profile, profileLoading, updateProfile, updateStats };
}
