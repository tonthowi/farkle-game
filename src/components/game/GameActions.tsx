import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { Button } from '../ui/Button';
import { isValidSelection } from '../../game/scoring';

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

  if (phase === 'rolling') {
    return (
      <div className="text-center py-2">
        <motion.p
          className="font-cinzel text-parchment text-lg"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          Rolling...
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
          Opponent is thinking...
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
            className="font-cinzel text-gold-bright font-bold text-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.4 }}
          >
            🔥 Hot Dice! Roll all 6!
          </motion.p>
        )}
        <Button variant="primary" size="lg" onClick={onRoll} className="w-full max-w-xs">
          🎲 Roll {isHotDice ? 'Again!' : 'Dice'}
        </Button>
      </div>
    );
  }

  if (phase === 'selecting') {
    return (
      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
        <p className="font-cinzel text-parchment-dim text-center text-sm">
          Select scoring dice, then choose:
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onBank}
          disabled={!hasValidSelection}
          className="w-full"
        >
          💰 Bank Points
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onRollMore}
          disabled={!hasValidSelection}
          className="w-full"
        >
          🎲 Keep Rolling
        </Button>
      </div>
    );
  }

  return null;
}
