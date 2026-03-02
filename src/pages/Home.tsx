import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

function MiniDie({ face }: { face: number }) {
  return (
    <div className="w-5 h-5 rounded-md bg-dice-face border border-dice-border shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full p-[3px]">
        {(PIP_POSITIONS[face] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={face === 1 ? 11 : 9} fill="#2d1b00" />
        ))}
      </svg>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { profile, profileLoading } = useProfile();
  const { signOut } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-wood-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 border-b-2 border-r-2 border-gold rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 border-t-2 border-l-2 border-gold rounded-tl-full" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.div
            className="text-7xl mb-3"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎲
          </motion.div>
          <h1 className="font-cinzel font-black text-gold text-5xl tracking-wider drop-shadow-lg">
            FARKLE
          </h1>
          <p className="font-cinzel text-parchment-dim text-sm tracking-[0.3em] mt-1">
            TAVERN DICE GAME
          </p>
        </motion.div>

        {/* Profile peek */}
        <motion.div
          variants={itemVariants}
          className="bg-wood border border-wood-light rounded-xl px-5 py-3 flex items-center gap-3 w-full"
        >
          <span className={`text-3xl ${profileLoading ? 'opacity-40' : ''}`}>
            {profile.avatar}
          </span>
          <div>
            <p className="font-cinzel text-parchment text-sm font-semibold">
              {profileLoading ? '…' : profile.name}
            </p>
            <p className="text-parchment-dim text-xs font-cinzel">
              {profileLoading ? '' : `${profile.stats.wins}W · ${profile.stats.losses}L`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="text-parchment-dim text-xs font-cinzel hover:text-gold transition-colors"
            >
              Edit ›
            </button>
            <button
              onClick={() => signOut()}
              className="text-parchment-dim text-xs font-cinzel hover:text-danger transition-colors"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </motion.div>

        {/* Play buttons */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3 w-full">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/setup?mode=vs-computer')}
          >
            ⚔️ vs Computer
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/lobby?action=create')}
          >
            🏰 Create Room
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/lobby?action=join')}
          >
            🔗 Join Room
          </Button>
        </motion.div>

        {/* Nav buttons */}
        <motion.div variants={itemVariants} className="flex gap-3 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => navigate('/history')}
          >
            📜 History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => navigate('/profile')}
          >
            👤 Profile
          </Button>
        </motion.div>

        {/* Scoring cheatsheet */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-wood/50 border border-wood-light rounded-xl p-4"
        >
          <p className="font-cinzel text-gold text-xs tracking-wider text-center mb-3 uppercase">Quick Rules</p>
          <div className="flex flex-col divide-y divide-wood-light/50">
            {[
              { dice: [1],             label: 'Single 1',        pts: '100 pts'   },
              { dice: [5],             label: 'Single 5',        pts: '50 pts'    },
              { dice: [1, 1, 1],       label: 'Three 1s',        pts: '1,000 pts' },
              { dice: [4, 4, 4],       label: 'Three of a Kind', pts: 'Face × 100'},
              { dice: [1, 2, 3, 4, 5, 6], label: 'Straight 1–6', pts: '1,500 pts'},
              { dice: [2, 2, 4, 4, 6, 6], label: 'Three Pairs',  pts: '750 pts'  },
            ].map(({ dice, label, pts }) => (
              <div key={label} className="py-2 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-cinzel text-parchment-dim text-xs">{label}</span>
                  <span className="font-cinzel text-gold font-semibold text-xs">{pts}</span>
                </div>
                <div className="flex gap-1">
                  {dice.map((face, i) => <MiniDie key={i} face={face} />)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-parchment-dim text-xs font-cinzel mt-3 pt-3 border-t border-wood-light">
            First to 10,000 wins!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
