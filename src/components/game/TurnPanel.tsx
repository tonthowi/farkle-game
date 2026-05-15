import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '../../types/game';
import { formatScore } from '../../utils/format';
import { calculateScore } from '../../game/scoring';

interface TurnPanelProps {
  state: GameState;
}

export function TurnPanel({ state }: TurnPanelProps) {
  const { turnScore, dice } = state;

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!state.turnDeadline || state.phase !== 'selecting') {
      setSecondsLeft(null);
      return;
    }
    const update = () => {
      setSecondsLeft(Math.max(0, Math.ceil((state.turnDeadline! - Date.now()) / 1000)));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [state.turnDeadline, state.phase]);

  const selectedDice = dice.filter((d) => d.isSelected);
  const selectionResult = selectedDice.length > 0
    ? calculateScore(selectedDice.map((d) => d.value))
    : null;

  const selScore = selectionResult?.score ?? 0;
  const potentialTotal = turnScore + selScore;
  const hasSelection = selScore > 0;

  return (
    <div className="score-ribbon rounded-sm" style={{ padding: '8px 16px' }}>
      {/* Roll # and dice remaining micro-labels */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-cinzel text-parchment-dim" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Roll № {state.rollCount}
        </span>
        {secondsLeft !== null && (
          <span
            className={`font-cinzel font-bold tabular-nums ${
              secondsLeft <= 5 ? 'text-danger-bright animate-pulse' : 'text-gold'
            }`}
            style={{ fontSize: 10 }}
          >
            ⏱ {secondsLeft}s
          </span>
        )}
      </div>

      {/* 3-column stat bar */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(122,90,31,0.4)' }}>

        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim uppercase tracking-widest" style={{ fontSize: 10 }}>
            Banked
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={turnScore}
              className="font-cinzel font-bold text-parchment tabular-nums leading-tight"
              style={{ fontSize: 18 }}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {formatScore(turnScore)}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim uppercase tracking-widest" style={{ fontSize: 10 }}>
            + Selected
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={selScore}
              className={`font-cinzel font-bold tabular-nums leading-tight transition-colors ${
                hasSelection ? 'text-gold' : 'text-parchment-dim'
              }`}
              style={{ fontSize: 18, opacity: hasSelection ? 1 : 0.4 }}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: hasSelection ? 1 : 0.4 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {hasSelection ? `+${formatScore(selScore)}` : '—'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim uppercase tracking-widest" style={{ fontSize: 10 }}>
            If Banked
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={potentialTotal}
              className={`font-cinzel font-bold tabular-nums leading-tight transition-colors ${
                hasSelection ? 'text-gold-bright' : 'text-parchment-dim'
              }`}
              style={{ fontSize: 18, opacity: hasSelection ? 1 : 0.4 }}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: hasSelection ? 1 : 0.4 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {hasSelection ? formatScore(potentialTotal) : '—'}
            </motion.span>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
