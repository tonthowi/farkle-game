import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '../../types/game';
import { Button } from '../ui/Button';
import { formatScore } from '../../utils/format';

interface FarkleAlertProps {
  state: GameState;
  onConfirm: () => void;
  isHumanTurn: boolean;
}

export function FarkleAlert({ state, onConfirm, isHumanTurn }: FarkleAlertProps) {
  const show = state.phase === 'farkled';
  const playerName = state.players[state.currentPlayerIndex]?.name ?? 'Player';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Red flash overlay */}
          <motion.div
            className="absolute inset-0 bg-danger/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.1] }}
            transition={{ duration: 0.4 }}
          />

          {/* Card */}
          <motion.div
            className="relative bg-danger-dark border-2 border-danger rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            initial={{ scale: 0.7, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <motion.p
              className="text-5xl mb-3"
              animate={{ rotate: [-5, 5, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              💀
            </motion.p>
            <h2 className="font-cinzel font-black text-white text-3xl mb-1">FARKLE!</h2>
            <p className="font-cinzel text-danger-light text-lg mb-2">
              {isHumanTurn ? 'You' : playerName} rolled nothing!
            </p>
            {state.turnScore > 0 && (
              <p className="font-cinzel text-white/60 text-sm mb-4">
                Lost {formatScore(state.turnScore)} points
              </p>
            )}
            {isHumanTurn ? (
              <Button variant="secondary" onClick={onConfirm} className="w-full">
                End Turn
              </Button>
            ) : (
              <motion.p
                className="font-cinzel text-white/50 text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Next player's turn...
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
