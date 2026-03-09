import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';
import { TOKEN_CONFIG } from '../config/tokens';
import { grants } from '../config/topup.config.json';

export function useTokens() {
  const { isGuest, user } = useAuth();
  const { profile, updateStats } = useProfile();

  const balance = profile.stats.tokens ?? TOKEN_CONFIG.STARTING_BALANCE;

  const canAfford = (cost: number) => !isGuest && balance >= cost;

  const applyDelta = (delta: number) => {
    if (isGuest) return;
    updateStats((prev) => ({
      tokens: Math.max(0, (prev.tokens ?? TOKEN_CONFIG.STARTING_BALANCE) + delta),
    }));
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
