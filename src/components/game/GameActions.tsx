import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { isValidSelection } from '../../game/scoring';
import { formatScore } from '../../utils/format';

interface GameActionsProps {
  state: GameState;
  onRoll: () => void;
  onRollMore: () => void;
  onBank: () => void;
  isHumanTurn: boolean;
}

export function GameActions({ state, onRoll, onRollMore, onBank, isHumanTurn }: GameActionsProps) {
  const { phase, dice } = state;
  const hasValidSelection = isValidSelection(dice.filter((d) => d.isSelected));
  const bankTotal = state.turnScore + state.selectedScore;

  if (phase === 'rolling') {
    return (
      <div className="text-center py-2">
        <motion.p
          className="font-cinzel text-parchment"
          style={{ fontSize: 16, letterSpacing: '0.1em' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          Casting the dice…
        </motion.p>
      </div>
    );
  }

  if (!isHumanTurn) {
    return (
      <div className="text-center py-4">
        <motion.p
          className="font-cinzel text-parchment-dim text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Opponent is thinking…
        </motion.p>
      </div>
    );
  }

  if (phase === 'idle' || phase === 'hot-dice') {
    const isHotDice = phase === 'hot-dice';
    return (
      <div className="flex flex-col items-center gap-3">
        {isHotDice && (
          <motion.p
            className="font-cinzel font-bold text-center text-gold-bright"
            style={{ fontSize: 15, letterSpacing: '0.1em' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.4 }}
          >
            🔥 Hot Dice! Roll all 6!
          </motion.p>
        )}
        <button
          className="btn-gold w-full max-w-xs"
          onClick={onRoll}
        >
          🎲 {isHotDice ? 'Roll Again!' : 'Cast the Dice'}
        </button>
      </div>
    );
  }

  if (phase === 'selecting') {
    return (
      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
        <p className="font-cinzel text-parchment-dim text-center" style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Select scoring dice, then choose:
        </p>
        <button
          className="btn-gold w-full"
          onClick={onBank}
          disabled={!hasValidSelection}
        >
          💰 Bank {hasValidSelection && bankTotal > 0 ? formatScore(bankTotal) : 'Points'}
        </button>
        <button
          className="btn-ghost w-full"
          onClick={onRollMore}
          disabled={!hasValidSelection}
        >
          🎲 ↻ Roll Remaining
        </button>
      </div>
    );
  }

  return null;
}
