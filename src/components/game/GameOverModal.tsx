import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { GameState } from '../../types/game';
import { Button } from '../ui/Button';
import { formatScore } from '../../utils/format';

interface GameOverModalProps {
  state: GameState;
  isOnlineMode: boolean;
  onRematch: () => void;
}

export function GameOverModal({ state, isOnlineMode, onRematch }: GameOverModalProps) {
  const navigate = useNavigate();
  const winner = state.winner !== null ? state.players[state.winner] : null;

  return (
    <AnimatePresence>
      {state.phase === 'game-over' && winner && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-wood border-2 border-gold rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 15, -15, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              {winner.avatar}
            </motion.div>
            <h2 className="font-cinzel font-black text-gold text-4xl mb-1">Victory!</h2>
            <p className="font-cinzel text-parchment text-xl mb-1">{winner.name} wins!</p>
            <p className="font-cinzel text-parchment-dim mb-6">
              Final score: {formatScore(winner.totalScore)}
            </p>

            <div className="space-y-2 mb-6">
              {state.players.map((p) => (
                <div key={p.id} className="flex justify-between items-center px-2">
                  <span className="font-cinzel text-parchment">
                    {p.avatar} {p.name}
                  </span>
                  <span
                    className={`font-cinzel font-bold tabular-nums ${
                      p === winner ? 'text-gold-bright' : 'text-parchment-dim'
                    }`}
                  >
                    {formatScore(p.totalScore)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                Menu
              </Button>
              {!isOnlineMode && (
                <Button variant="primary" className="flex-1" onClick={onRematch}>
                  Rematch
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
