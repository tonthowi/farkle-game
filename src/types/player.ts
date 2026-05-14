export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  bestScore: number;
  totalPointsScored: number;
  totalFarkles: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  stats: PlayerStats;
}

export const AVATARS = ['🎲', '🗡️', '🍺', '👑', '🔥', '💀', '🏰', '⚔️', '🌙', '🍀', '🐉', '🎭'];

export const DEFAULT_PROFILE: UserProfile = {
  id: crypto.randomUUID(),
  name: 'Traveller',
  avatar: '🎲',
  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    bestScore: 0,
    totalPointsScored: 0,
    totalFarkles: 0,
  },
};
