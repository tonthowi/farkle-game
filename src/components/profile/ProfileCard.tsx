import type { UserProfile } from '../../types/player';
import { formatScore, formatWinRate } from '../../utils/format';

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { stats } = profile;

  const statRows = [
    { label: 'Games Played', value: stats.gamesPlayed },
    { label: 'Wins', value: stats.wins },
    { label: 'Losses', value: stats.losses },
    { label: 'Win Rate', value: formatWinRate(stats.wins, stats.gamesPlayed) },
    { label: 'Best Score', value: formatScore(stats.bestScore) },
    { label: 'Total Points', value: formatScore(stats.totalPointsScored) },
  ];

  return (
    <div className="bg-wood border border-wood-light rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{profile.avatar}</span>
        <div>
          <h2 className="font-cinzel font-bold text-parchment-bright text-xl">{profile.name}</h2>
          <p className="text-parchment-dim text-sm font-cinzel">Dice Player</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statRows.map(({ label, value }) => (
          <div key={label} className="bg-wood-darkest/60 rounded-lg p-3 border border-wood-light">
            <p className="text-parchment-dim text-xs font-cinzel tracking-wide">{label}</p>
            <p className="text-gold-bright font-cinzel font-bold text-lg tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
