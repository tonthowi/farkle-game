import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Difficulty } from '../types/game';
import { BrandMark } from '../components/ui/BrandMark';
import { useProfile } from '../hooks/useProfile';

interface SetupState {
  difficulty: Difficulty;
  targetScore: number;
}

const OPPONENTS: Record<Difficulty, { name: string; avatar: string; desc: string; title: string }> = {
  easy:   { name: 'Old Marek',       avatar: '🧓', desc: 'Banks early, takes few risks',      title: 'The Cautious Innkeeper' },
  medium: { name: 'Iva the Cooper',  avatar: '👩', desc: 'Balanced risk-taking',               title: 'The Tavern Regular'     },
  hard:   { name: 'Lord Veshir',     avatar: '🎩', desc: 'Optimal expected-value play',        title: 'The Dice Master'        },
};

export function Setup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLocalMultiplayer = searchParams.get('mode') === 'local-multiplayer';
  const { profile } = useProfile();

  const [setup, setSetup] = useState<SetupState>({
    difficulty: 'medium',
    targetScore: 10000,
  });

  const difficulties: { value: Difficulty; label: string }[] = [
    { value: 'easy',   label: 'Beginner'       },
    { value: 'medium', label: 'Tavern Regular'  },
    { value: 'hard',   label: 'Dice Master'     },
  ];

  const targets = [5000, 10000, 15000];

  function handleStart() {
    if (isLocalMultiplayer) {
      navigate('/game', {
        state: {
          mode: 'local-multiplayer',
          players: [
            { name: profile.name || 'Player 1', avatar: profile.avatar, isHuman: true },
            { name: 'Player 2', avatar: '🎲', isHuman: true },
          ],
          targetScore: setup.targetScore,
        },
      });
    } else {
      const opp = OPPONENTS[setup.difficulty];
      navigate('/game', {
        state: {
          mode: 'vs-computer',
          difficulty: setup.difficulty,
          players: [
            { name: profile.name || 'Player 1', avatar: profile.avatar, isHuman: true },
            { name: opp.name, avatar: opp.avatar, isHuman: false },
          ],
          targetScore: setup.targetScore,
        },
      });
    }
  }

  const currentOpp = OPPONENTS[setup.difficulty];

  return (
    <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
      <div className="candle-glow" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
        <button className="btn-link" onClick={() => navigate('/')}>‹ Back</button>
        <BrandMark small />
        <div className="w-16" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: 520, margin: '0 auto', width: '100%', paddingBottom: 96 }}>

        <div className="font-cinzel" style={{ textAlign: 'center', color: '#e8c374', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 20 }}>
          ✦ {isLocalMultiplayer ? 'Pass & Play' : 'Duel the Tavernkeep'} ✦
        </div>

        {/* Player identity */}
        <motion.div
          className="panel"
          style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <span style={{ fontSize: 36, lineHeight: 1 }}>{profile.avatar}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-cinzel" style={{ fontSize: 16, color: '#ece1c1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.name}
            </div>
            <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Playing as you
            </div>
          </div>
          <button className="btn-link" onClick={() => navigate('/profile')}>My Profile ›</button>
        </motion.div>

        {/* Opponent preview (vs-computer only) */}
        {!isLocalMultiplayer && (
          <motion.div
            className="panel"
            style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            key={setup.difficulty}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>{currentOpp.avatar}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-cinzel" style={{ fontSize: 16, color: '#ece1c1', fontWeight: 600 }}>
                {currentOpp.name}
              </div>
              <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {currentOpp.title}
              </div>
            </div>
            <div className="font-cinzel" style={{ fontSize: 10, color: '#cdb992', fontStyle: 'italic', textAlign: 'right', maxWidth: 100 }}>
              {currentOpp.desc}
            </div>
          </motion.div>
        )}

        {/* Difficulty (vs-computer only) */}
        {!isLocalMultiplayer && (
          <motion.div
            className="panel"
            style={{ padding: '16px 18px', marginBottom: 16 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="font-cinzel" style={{ color: '#e8c374', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
              Difficulty
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {difficulties.map(({ value, label }) => {
                const opp = OPPONENTS[value];
                const selected = setup.difficulty === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSetup(s => ({ ...s, difficulty: value }))}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 3,
                      border: selected ? '1px solid #e8c374' : '1px solid #7a5a1f',
                      background: selected ? 'rgba(232,195,116,0.08)' : 'rgba(20,12,5,0.4)',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{opp.avatar}</span>
                    <div>
                      <div className="font-cinzel" style={{ fontSize: 13, color: selected ? '#ece1c1' : '#cdb992', fontWeight: 600, letterSpacing: '0.05em' }}>
                        {opp.name}
                        <span style={{ color: '#7a6a4b', fontWeight: 400, marginLeft: 8 }}>— {label}</span>
                      </div>
                      <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', marginTop: 2 }}>{opp.desc}</div>
                    </div>
                    {selected && (
                      <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#e8c374', boxShadow: '0 0 6px rgba(232,195,116,0.6)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Target score */}
        <motion.div
          className="panel"
          style={{ padding: '16px 18px', marginBottom: 16 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="font-cinzel" style={{ color: '#e8c374', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            Target Score
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {targets.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSetup(s => ({ ...s, targetScore: t }))}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 3,
                  border: setup.targetScore === t ? '1px solid #e8c374' : '1px solid #7a5a1f',
                  background: setup.targetScore === t ? 'rgba(232,195,116,0.08)' : 'rgba(20,12,5,0.4)',
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: setup.targetScore === t ? '#e8c374' : '#cdb992',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.05em',
                }}
              >
                {t.toLocaleString()}
              </button>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Fixed start button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', borderTop: '1px solid #2b2118', background: 'rgba(10,6,3,0.95)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <button className="btn-gold w-full" onClick={handleStart}>
            ⚔️ Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
