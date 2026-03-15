import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';
import { COIN_CONFIG } from '../config/coins';
import { grants } from '../config/topup.config.json';

export function useCoins() {
  const { isGuest, user } = useAuth();
  const { profile, profileLoading, updateStats } = useProfile();

  // Return undefined while profile is loading to avoid a stale-default flash
  const balance: number | undefined = profileLoading
    ? undefined
    : (profile.stats.coins ?? COIN_CONFIG.STARTING_BALANCE);

  const canAfford = (cost: number) => !isGuest && (balance ?? 0) >= cost;

  /**
   * Apply a coin delta to the authenticated user's balance.
   * Intentionally no-ops for guest users — guests don't earn or spend coins.
   * Returns `{ applied: boolean }` so callers can detect the no-op if needed.
   */
  const applyDelta = (delta: number): { applied: boolean } => {
    if (isGuest) return { applied: false };
    updateStats((prev) => ({
      coins: Math.max(0, (prev.coins ?? balance ?? COIN_CONFIG.STARTING_BALANCE) + delta),
    }));
    return { applied: true };
  };

  const applyTopupGrants = () => {
    if (isGuest || !user) return;
    const applied: string[] = JSON.parse(
      localStorage.getItem('farkle_applied_grants') ?? '[]'
    );
    const pending = grants.filter(
      (g) => g.userId === user.id && !applied.includes(g.id)
    );
    if (!pending.length) return;
    applyDelta(pending.reduce((sum, g) => sum + g.amount, 0));
    localStorage.setItem(
      'farkle_applied_grants',
      JSON.stringify([...applied, ...pending.map((g) => g.id)])
    );
  };

  return { balance, canAfford, applyDelta, applyTopupGrants };
}
