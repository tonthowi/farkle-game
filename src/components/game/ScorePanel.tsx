import { motion } from 'framer-motion';
import type { PlayerState } from '../../types/game';
import { formatScore } from '../../utils/format';

interface ScorePanelProps {
  players: PlayerState[];
  currentPlayerIndex: number;
  targetScore: number;
  turnScore?: number;
}

export function ScorePanel({ players, currentPlayerIndex, targetScore, turnScore = 0 }: ScorePanelProps) {
  return (
    <div className="flex gap-3 w-full">
      {players.map((player, i) => {
        const isActive = i === currentPlayerIndex;
        const progress = Math.min(player.totalScore / targetScore, 1);

        return (
          <motion.div
            key={player.id}
            className={`flex-1 rounded-sm border p-4 transition-all duration-300 ${
              isActive ? 'panel panel-active' : 'panel opacity-75'
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
                  <p className="font-cinzel text-[10px] uppercase tracking-widest" style={{ color: '#e8c374' }}>
                    ▸ Throwing
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            <div aria-live="polite" aria-atomic="true">
              <motion.p
                className={`font-cinzel font-bold text-2xl tabular-nums ${isActive ? 'text-gold-bright' : 'text-parchment-dim'}`}
                key={player.totalScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {formatScore(player.totalScore)}
                {isActive && turnScore > 0 && (
                  <span className="text-sm text-gold ml-1 font-normal">+{formatScore(turnScore)}</span>
                )}
              </motion.p>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#0a0603' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7a5a1f, #e8c374)', boxShadow: '0 0 6px rgba(232,195,116,0.4)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-parchment-dim text-xs mt-1 text-right font-cinzel">
              {formatScore(targetScore - player.totalScore)} to go
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
