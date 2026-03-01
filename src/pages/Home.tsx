import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useProfile } from '../hooks/useProfile';

export function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

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
            KINGDOM COME
          </p>
        </motion.div>

        {/* Profile peek */}
        <motion.div
          variants={itemVariants}
          className="bg-wood border border-wood-light rounded-xl px-5 py-3 flex items-center gap-3 w-full"
        >
          <span className="text-3xl">{profile.avatar}</span>
          <div>
            <p className="font-cinzel text-parchment text-sm font-semibold">{profile.name}</p>
            <p className="text-parchment-dim text-xs font-cinzel">
              {profile.stats.wins}W · {profile.stats.losses}L
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="ml-auto text-parchment-dim text-xs font-cinzel hover:text-gold transition-colors"
          >
            Edit ›
          </button>
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
            onClick={() => navigate('/setup?mode=local-multiplayer')}
          >
            👥 Local Multiplayer
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
          <div className="grid grid-cols-2 gap-1 text-xs font-cinzel text-parchment-dim">
            {[
              ['Single 1', '100 pts'],
              ['Single 5', '50 pts'],
              ['Three 1s', '1,000 pts'],
              ['Three of a Kind', 'Face × 100'],
              ['Straight 1-6', '1,500 pts'],
              ['Three Pairs', '750 pts'],
            ].map(([rule, pts]) => (
              <div key={rule} className="flex justify-between gap-2 py-0.5">
                <span className="text-parchment-dim">{rule}</span>
                <span className="text-gold font-semibold">{pts}</span>
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
