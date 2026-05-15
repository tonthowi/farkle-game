import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BrandMark } from '../components/ui/BrandMark';

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

function PodiumCard({ entry, place, isMe }: { entry: LeaderboardEntry; place: number; isMe: boolean }) {
  const heights: Record<number, number> = { 1: 90, 2: 70, 3: 56 };
  const placeColors: Record<number, string> = {
    1: '#f3d989',
    2: '#cdb992',
    3: '#c9994a',
  };
  const medals: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' };
  const height = heights[place] ?? 56;
  const color = placeColors[place] ?? '#7a6a4b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: place === 1 ? '0 0 40%' : '0 0 28%' }}>
      <span style={{ fontSize: 22 }}>{entry.avatar}</span>
      <div className="font-cinzel" style={{ fontSize: 11, color: '#ece1c1', fontWeight: 600, textAlign: 'center', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {entry.username}
        {isMe && <span style={{ color: '#e8c374', fontSize: 9, marginLeft: 4 }}>(you)</span>}
      </div>
      <div className="font-cinzel" style={{ fontSize: 12, color: '#7a6a4b' }}>
        {entry.stats.wins}W
      </div>
      <div
        style={{
          width: '100%',
          height,
          background: `linear-gradient(180deg, ${color}22 0%, ${color}11 100%)`,
          border: `1px solid ${color}55`,
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 20 }}>{medals[place]}</span>
        <span className="font-cinzel" style={{ fontSize: 18, fontWeight: 700, color }}>{place}</span>
      </div>
    </div>
  );
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

  const top3 = entries.slice(0, 3);

  return (
    <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
      <div className="candle-glow" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
        <button className="btn-link" onClick={() => navigate('/')}>‹ Back</button>
        <BrandMark small />
        <div className="w-12" />
      </div>

      <div style={{ flex: 1, padding: '16px', maxWidth: 520, margin: '0 auto', width: '100%' }}>

        <div className="font-cinzel" style={{ textAlign: 'center', color: '#e8c374', fontSize: 13, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 20 }}>
          ✦ Hall of Champions ✦
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="panel animate-pulse" style={{ height: 44, opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="font-cinzel text-parchment-dim text-center mt-12">
            No players yet. Be the first!
          </p>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length >= 3 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 28, padding: '0 8px' }}>
                {/* 2nd */}
                <PodiumCard entry={top3[1]} place={2} isMe={top3[1]?.id === user?.id} />
                {/* 1st — center, tallest */}
                <PodiumCard entry={top3[0]} place={1} isMe={top3[0]?.id === user?.id} />
                {/* 3rd */}
                <PodiumCard entry={top3[2]} place={3} isMe={top3[2]?.id === user?.id} />
              </div>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-2 px-3 mb-1">
              <span className="font-cinzel text-parchment-dim uppercase tracking-wider" style={{ fontSize: 10 }}>#</span>
              <span className="font-cinzel text-parchment-dim uppercase tracking-wider" style={{ fontSize: 10 }}>Player</span>
              <span className="font-cinzel text-parchment-dim uppercase tracking-wider text-right" style={{ fontSize: 10 }}>W</span>
              <span className="font-cinzel text-parchment-dim uppercase tracking-wider text-right" style={{ fontSize: 10 }}>G</span>
              <span className="font-cinzel text-parchment-dim uppercase tracking-wider text-right" style={{ fontSize: 10 }}>Best</span>
            </div>

            <motion.div
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {entries.map((entry, idx) => {
                const isMe = entry.id === user?.id;
                const wins = entry.stats?.wins ?? 0;
                const games = entry.stats?.gamesPlayed ?? 0;
                const best = entry.stats?.bestScore ?? 0;
                const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
                const isTopThree = idx < 3;

                return (
                  <motion.div
                    key={entry.id}
                    className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-2 items-center panel"
                    style={{
                      padding: '10px 12px',
                      borderColor: isMe ? '#e8c374' : isTopThree ? '#c9994a55' : '#7a5a1f',
                      background: isMe ? 'rgba(232,195,116,0.06)' : undefined,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <span className={`font-cinzel text-sm font-bold tabular-nums ${
                      idx === 0 ? 'text-gold-leaf' : idx === 1 ? 'text-parchment-bright' : idx === 2 ? 'text-gold' : 'text-parchment-dim'
                    }`} style={{ opacity: idx > 2 ? 0.6 : 1 }}>
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none shrink-0">{entry.avatar}</span>
                      <div className="min-w-0">
                        <p className={`font-cinzel text-sm font-semibold truncate ${isMe ? 'text-gold-bright' : 'text-parchment'}`}>
                          {entry.username}
                          {isMe && <span className="text-[10px] text-gold-leaf ml-1">(you)</span>}
                        </p>
                        <p className="font-cinzel text-parchment-dim" style={{ fontSize: 10 }}>{winRate}% win rate</p>
                      </div>
                    </div>

                    <span className="font-cinzel text-parchment font-bold text-sm tabular-nums text-right">{wins}</span>
                    <span className="font-cinzel text-parchment-dim text-sm tabular-nums text-right">{games}</span>
                    <span className="font-cinzel text-gold text-xs tabular-nums text-right">{best.toLocaleString()}</span>
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
