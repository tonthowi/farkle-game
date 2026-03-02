import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Difficulty } from '../types/game';
import { Button } from '../components/ui/Button';
import { useProfile } from '../hooks/useProfile';

interface SetupState {
  difficulty: Difficulty;
  targetScore: number;
}

export function Setup() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [setup, setSetup] = useState<SetupState>({
    difficulty: 'medium',
    targetScore: 10000,
  });

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'Beginner', desc: 'Banks early, takes few risks' },
    { value: 'medium', label: 'Tavern Regular', desc: 'Balanced risk-taking' },
    { value: 'hard', label: 'Dice Master', desc: 'Optimal expected value play' },
  ];

  const targets = [5000, 10000, 15000];

  function handleStart() {
    const players = [
      { name: profile.name || 'Player 1', avatar: profile.avatar, isHuman: true },
      { name: 'Computer', avatar: '💀', isHuman: false },
    ];

    navigate('/game', {
      state: {
        mode: 'vs-computer',
        difficulty: setup.difficulty,
        players,
        targetScore: setup.targetScore,
      },
    });
  }

  return (
    <div className="min-h-screen bg-wood-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>
        <h1 className="font-cinzel font-bold text-gold text-xl">
          vs Computer
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-md mx-auto w-full pb-24">
        {/* Player identity (read-only) */}
        <motion.div
          className="bg-wood border border-wood-light rounded-xl p-4 flex items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <span className="text-4xl leading-none">{profile.avatar}</span>
          <div className="flex-1 min-w-0">
            <p className="font-cinzel font-bold text-parchment-bright text-lg leading-tight truncate">
              {profile.name}
            </p>
            <p className="font-cinzel text-parchment-dim text-xs mt-0.5">Playing as you</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="font-cinzel text-xs text-gold hover:text-gold-bright transition-colors whitespace-nowrap"
          >
            My Profile ›
          </button>
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="bg-wood border border-wood-light rounded-xl p-5 space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="font-cinzel text-gold font-semibold">Difficulty</p>
          <div className="flex flex-col gap-2">
            {difficulties.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSetup((s) => ({ ...s, difficulty: value }))}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  setup.difficulty === value
                    ? 'border-gold bg-felt text-parchment-bright'
                    : 'border-wood-light bg-wood-darkest text-parchment-dim hover:border-gold/40'
                }`}
              >
                <span className="font-cinzel font-semibold block">{label}</span>
                <span className="text-xs font-cinzel text-parchment-dim">{desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Target score */}
        <motion.div
          className="bg-wood border border-wood-light rounded-xl p-5 space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="font-cinzel text-gold font-semibold">Target Score</p>
          <div className="flex gap-2">
            {targets.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSetup((s) => ({ ...s, targetScore: t }))}
                className={`flex-1 py-2.5 rounded-lg border font-cinzel font-semibold transition-all ${
                  setup.targetScore === t
                    ? 'border-gold bg-felt text-gold-bright'
                    : 'border-wood-light bg-wood-darkest text-parchment-dim hover:border-gold/40'
                }`}
              >
                {t.toLocaleString()}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fixed start button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-wood-darkest border-t border-wood-light">
        <div className="max-w-md mx-auto">
          <Button variant="primary" size="lg" className="w-full" onClick={handleStart}>
            ⚔️ Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
