import { motion } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import { formatScore } from '../../utils/format';

interface ScorePanelProps {
  players: PlayerState[];
  currentPlayerIndex: number;
  targetScore: number;
}

export function ScorePanel({ players, currentPlayerIndex, targetScore }: ScorePanelProps) {
  return (
    <div className="flex gap-3 w-full">
      {players.map((player, i) => {
        const isActive = i === currentPlayerIndex;
        const progress = Math.min(player.totalScore / targetScore, 1);

        return (
          <motion.div
            key={player.id}
            className={`flex-1 rounded-xl border p-4 transition-all duration-300 ${
              isActive
                ? 'bg-felt border-gold shadow-lg shadow-gold/20'
                : 'bg-wood border-wood-light opacity-70'
            }`}
            animate={{ scale: isActive ? 1.02 : 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{player.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-cinzel font-semibold text-sm truncate ${isActive ? 'text-parchment-bright' : 'text-parchment-dim'}`}>
                  {player.name}
                </p>
                {isActive && (
                  <p className="text-gold text-xs font-cinzel">▶ Playing</p>
                )}
              </div>
            </div>

            {/* Score */}
            <motion.p
              className={`font-cinzel font-bold text-2xl tabular-nums ${isActive ? 'text-gold-bright' : 'text-parchment-dim'}`}
              key={player.totalScore}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {formatScore(player.totalScore)}
            </motion.p>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-wood-darkest rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-parchment-dim text-xs mt-1 text-right">
              {formatScore(targetScore - player.totalScore)} to go
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
