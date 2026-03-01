import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '../../types/game';
import { formatScore } from '../../utils/format';
import { calculateScore } from '../../game/scoring';

interface TurnPanelProps {
  state: GameState;
}

export function TurnPanel({ state }: TurnPanelProps) {
  const { turnScore, dice } = state;

  const selectedDice = dice.filter((d) => d.isSelected);
  const selectionResult = selectedDice.length > 0
    ? calculateScore(selectedDice.map((d) => d.value))
    : null;

  const selScore = selectionResult?.score ?? 0;
  const potentialTotal = turnScore + selScore;
  const hasSelection = selScore > 0;

  return (
    <div className="bg-wood-darkest/60 rounded-xl border border-wood-light px-4 py-2">
      {/* Fixed 3-column stat bar — height never changes */}
      <div className="grid grid-cols-3 divide-x divide-wood-light">

        {/* Col 1: Banked this turn */}
        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-widest">
            Banked
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={turnScore}
              className="font-cinzel font-bold text-parchment text-lg tabular-nums leading-tight"
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {formatScore(turnScore)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Col 2: Selected dice score */}
        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-widest">
            + Selected
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={selScore}
              className={`font-cinzel font-bold text-lg tabular-nums leading-tight transition-colors ${
                hasSelection ? 'text-gold' : 'text-parchment-dim/40'
              }`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {hasSelection ? `+${formatScore(selScore)}` : '—'}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Col 3: Potential total if banked now */}
        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-widest">
            If Banked
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={potentialTotal}
              className={`font-cinzel font-bold text-lg tabular-nums leading-tight transition-colors ${
                hasSelection ? 'text-gold-bright' : 'text-parchment-dim/40'
              }`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {hasSelection ? formatScore(potentialTotal) : '—'}
            </motion.span>
          </AnimatePresence>
        </div>

      </div>

      {/* Roll counter — always present footer */}
      <div className="text-right mt-1.5">
        <span className="text-parchment-dim text-[10px] font-cinzel">
          Roll #{state.rollCount}
        </span>
      </div>
    </div>
  );
}
