import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GameMode, Difficulty } from '../types/game';
import { Button } from '../components/ui/Button';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { useProfile } from '../hooks/useProfile';

interface SetupState {
  mode: GameMode;
  difficulty: Difficulty;
  player1Name: string;
  player1Avatar: string;
  player2Name: string;
  player2Avatar: string;
  targetScore: number;
}

export function Setup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useProfile();

  const modeParam = (params.get('mode') ?? 'vs-computer') as GameMode;

  const [setup, setSetup] = useState<SetupState>({
    mode: modeParam,
    difficulty: 'medium',
    player1Name: profile.name,
    player1Avatar: profile.avatar,
    player2Name: modeParam === 'vs-computer' ? 'Computer' : 'Player 2',
    player2Avatar: modeParam === 'vs-computer' ? '💀' : '⚔️',
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
      { name: setup.player1Name || 'Player 1', avatar: setup.player1Avatar, isHuman: true },
      {
        name: setup.player2Name || (setup.mode === 'vs-computer' ? 'Computer' : 'Player 2'),
        avatar: setup.player2Avatar,
        isHuman: setup.mode === 'local-multiplayer',
      },
    ];

    navigate('/game', {
      state: {
        mode: setup.mode,
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
          {setup.mode === 'vs-computer' ? 'vs Computer' : 'Local Multiplayer'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-md mx-auto w-full pb-24">
        {/* Player 1 */}
        <motion.div
          className="bg-wood border border-wood-light rounded-xl p-5 space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="font-cinzel text-gold font-semibold">Your Name</p>
          <input
            type="text"
            value={setup.player1Name}
            onChange={(e) => setSetup((s) => ({ ...s, player1Name: e.target.value }))}
            maxLength={20}
            className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel focus:outline-none focus:border-gold"
            placeholder="Enter your name"
          />
          <p className="font-cinzel text-parchment-dim text-sm">Your Avatar</p>
          <AvatarPicker
            value={setup.player1Avatar}
            onChange={(a) => setSetup((s) => ({ ...s, player1Avatar: a }))}
          />
        </motion.div>

        {/* Player 2 / Computer */}
        {setup.mode === 'local-multiplayer' && (
          <motion.div
            className="bg-wood border border-wood-light rounded-xl p-5 space-y-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="font-cinzel text-gold font-semibold">Player 2 Name</p>
            <input
              type="text"
              value={setup.player2Name}
              onChange={(e) => setSetup((s) => ({ ...s, player2Name: e.target.value }))}
              maxLength={20}
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel focus:outline-none focus:border-gold"
              placeholder="Player 2"
            />
            <p className="font-cinzel text-parchment-dim text-sm">Player 2 Avatar</p>
            <AvatarPicker
              value={setup.player2Avatar}
              onChange={(a) => setSetup((s) => ({ ...s, player2Avatar: a }))}
            />
          </motion.div>
        )}

        {/* Difficulty (vs computer only) */}
        {setup.mode === 'vs-computer' && (
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
        )}

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
