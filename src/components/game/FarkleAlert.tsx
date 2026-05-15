import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '../../types/game';
import { formatScore } from '../../utils/format';

interface FarkleAlertProps {
  state: GameState;
  onConfirm: () => void;
  isHumanTurn: boolean;
}

export function FarkleAlert({ state, onConfirm, isHumanTurn }: FarkleAlertProps) {
  const show = state.phase === 'farkled';
  const lostScore = state.turnScore;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(80,15,15,0.4) 0%, rgba(0,0,0,0.72) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            style={{
              padding: '40px 48px',
              background: 'linear-gradient(180deg, rgba(60,15,15,0.97), rgba(20,5,5,0.99))',
              border: '1px solid #b13838',
              borderRadius: 4,
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(177,56,56,0.3), 0 24px 64px rgba(0,0,0,0.8)',
              maxWidth: 360,
              width: '100%',
            }}
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div
              className="font-cinzel font-black"
              style={{ fontSize: 56, color: '#ff9a9a', letterSpacing: '0.32em', marginBottom: 16, textShadow: '0 0 30px rgba(177,56,56,0.6)' }}
            >
              FARKLE
            </div>

            <p style={{ fontStyle: 'italic', color: '#d0a0a0', fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 24 }}>
              {lostScore > 0
                ? `${formatScore(lostScore)} points slip away into the night.`
                : 'Turn forfeit. No harm done.'}
            </p>

            {isHumanTurn ? (
              <button
                className="btn-ghost w-full"
                onClick={onConfirm}
                style={{ borderColor: '#b13838', color: '#d0a0a0' }}
              >
                End Turn
              </button>
            ) : (
              <motion.p
                className="font-cinzel"
                style={{ color: 'rgba(208,160,160,0.5)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Next player's turn…
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
