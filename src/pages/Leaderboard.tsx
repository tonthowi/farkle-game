import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  stats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    bestScore: number;
  };
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, avatar, stats')
      .not('stats', 'is', null)
      .limit(100)
      .then(({ data }) => {
        const sorted = [...(data ?? [])]
          .sort((a, b) => ((b.stats as LeaderboardEntry['stats'])?.wins ?? 0) - ((a.stats as LeaderboardEntry['stats'])?.wins ?? 0))
          .slice(0, 20) as LeaderboardEntry[];
        setEntries(sorted);
        setLoading(false);
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-wood-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>
        <h1 className="font-cinzel text-gold font-bold tracking-wider">LEADERBOARD</h1>
        <div className="w-12" />
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex flex-col gap-2 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-wood/50 animate-pulse"
                style={{ opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="font-cinzel text-parchment-dim text-center mt-12">
            No players yet. Be the first!
          </p>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-2 px-3 mb-1">
              <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-wider">#</span>
              <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-wider">Player</span>
              <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-wider text-right">W</span>
              <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-wider text-right">G</span>
              <span className="font-cinzel text-parchment-dim text-[10px] uppercase tracking-wider text-right">Best</span>
            </div>

            <motion.div
              className="flex flex-col gap-1.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {entries.map((entry, idx) => {
                const isMe = entry.id === user?.id;
                const wins = entry.stats?.wins ?? 0;
                const games = entry.stats?.gamesPlayed ?? 0;
                const best = entry.stats?.bestScore ?? 0;
                const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

                return (
                  <motion.div
                    key={entry.id}
                    variants={rowVariants}
                    className={`grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-2 items-center
                      px-3 py-2.5 rounded-xl border transition-colors
                      ${isMe
                        ? 'bg-gold/10 border-gold/40'
                        : 'bg-wood/50 border-wood-light'
                      }`}
                  >
                    <span className={`font-cinzel text-sm font-bold tabular-nums ${
                      idx === 0 ? 'text-gold-bright' : idx === 1 ? 'text-parchment' : idx === 2 ? 'text-parchment-dim' : 'text-parchment-dim/60'
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none shrink-0">{entry.avatar}</span>
                      <div className="min-w-0">
                        <p className={`font-cinzel text-sm font-semibold truncate ${isMe ? 'text-gold' : 'text-parchment'}`}>
                          {entry.username}
                          {isMe && <span className="text-[10px] text-gold-bright ml-1">(you)</span>}
                        </p>
                        <p className="font-cinzel text-parchment-dim text-[10px]">{winRate}% win rate</p>
                      </div>
                    </div>

                    <span className="font-cinzel text-parchment font-bold text-sm tabular-nums text-right">
                      {wins}
                    </span>

                    <span className="font-cinzel text-parchment-dim text-sm tabular-nums text-right">
                      {games}
                    </span>

                    <span className="font-cinzel text-gold text-xs tabular-nums text-right">
                      {best.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
