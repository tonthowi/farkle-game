import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WelcomeModal } from '../components/ui/WelcomeModal';
import { BrandMark } from '../components/ui/BrandMark';
import { Flourish } from '../components/ui/Flourish';
import { QuickReference } from '../components/game/QuickReference';
import { useProfile } from '../hooks/useProfile';

function ModeCard({
  title,
  sub,
  foot,
  accent,
  onClick,
}: {
  title: string;
  sub: string;
  foot: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="panel text-left"
      style={{
        padding: '22px 22px',
        cursor: 'pointer',
        border: accent ? '1px solid #e8c374' : '1px solid #7a5a1f',
        background: accent
          ? 'linear-gradient(180deg, rgba(70,50,20,0.85), rgba(30,20,8,0.92))'
          : 'linear-gradient(180deg, rgba(40,30,18,0.85), rgba(15,10,5,0.92))',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.12s, border-color 0.15s',
        fontFamily: 'inherit',
        color: 'inherit',
        borderRadius: 4,
        width: '100%',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {accent && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 9, letterSpacing: '0.2em', color: '#e8c374',
          fontFamily: 'Cinzel, serif', textTransform: 'uppercase',
          padding: '2px 7px', border: '1px solid #7a5a1f', borderRadius: 2,
        }}>
          Recommended
        </div>
      )}
      <div className="font-cinzel" style={{ fontSize: 18, color: '#ece1c1', marginBottom: 6, letterSpacing: '0.03em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: 15, color: '#cdb992', fontStyle: 'italic', marginBottom: 12 }}>
        {sub}
      </div>
      <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        <span>{foot}</span>
        <span style={{ flex: 1, height: 1, background: '#7a5a1f', opacity: 0.5 }} />
        <span style={{ color: '#e8c374' }}>Enter ›</span>
      </div>
    </button>
  );
}

function SecondaryTile({ title, sub, icon, onClick }: { title: string; sub: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(20,12,5,0.5)',
        border: '1px solid #7a5a1f',
        borderRadius: 3,
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'inherit',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        width: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,153,74,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9994a'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,12,5,0.5)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#7a5a1f'; }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div className="font-cinzel" style={{ fontSize: 12, letterSpacing: '0.1em', color: '#ece1c1', fontWeight: 600 }}>{title}</div>
        <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub}</div>
      </div>
    </button>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem('farkle_profile'),
  );

  return (
    <>
      {showWelcome && <WelcomeModal onComplete={() => setShowWelcome(false)} />}

      <div className="bg-oak" style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="candle-glow" />

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px 60px', position: 'relative' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <BrandMark small />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="font-cinzel" style={{ fontSize: 11, color: '#7a6a4b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#7fc88f', marginRight: 6, boxShadow: '0 0 6px #7fc88f' }} />
                Online
              </div>
              <button className="btn-link" onClick={() => navigate('/profile')}>Profile</button>
            </div>
          </div>

          {/* Tavern banner */}
          <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
            <svg width="52" height="52" viewBox="0 0 64 64" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}>
              <defs>
                <linearGradient id="bigdie" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fbf6ea" />
                  <stop offset="100%" stopColor="#c5b89c" />
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="52" height="52" rx="10" fill="url(#bigdie)" stroke="#a89870" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="3.5" fill="#1a1208" />
              <circle cx="44" cy="20" r="3.5" fill="#1a1208" />
              <circle cx="32" cy="32" r="3.5" fill="#1a1208" />
              <circle cx="20" cy="44" r="3.5" fill="#1a1208" />
              <circle cx="44" cy="44" r="3.5" fill="#1a1208" />
            </svg>
            <h1 className="font-cinzel" style={{ margin: '12px 0 4px', fontSize: 46, letterSpacing: '0.36em', color: '#f3d989', fontWeight: 700, textShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 30px rgba(232,195,116,0.25)' }}>
              FARKLE
            </h1>
            <div className="font-cinzel" style={{ color: '#7a6a4b', fontSize: 11, letterSpacing: '0.5em' }}>
              ✦ A Tavern Dice Game ✦
            </div>
          </div>

          {/* Profile strip */}
          <motion.div
            className="panel"
            style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{profile.avatar}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-cinzel" style={{ fontSize: 16, color: '#ece1c1', fontWeight: 600, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name}
              </div>
              <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Tavern Regular
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, paddingRight: 14, borderRight: '1px solid #7a5a1f', marginRight: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-cinzel" style={{ fontSize: 9, color: '#7a6a4b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Wins</div>
                <div className="font-cinzel" style={{ fontSize: 18, color: '#e8c374', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{profile.stats.wins}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-cinzel" style={{ fontSize: 9, color: '#7a6a4b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Losses</div>
                <div className="font-cinzel" style={{ fontSize: 18, color: '#cdb992', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{profile.stats.losses}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-cinzel" style={{ fontSize: 9, color: '#7a6a4b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Best</div>
                <div className="font-cinzel" style={{ fontSize: 18, color: '#e8c374', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{profile.stats.bestScore.toLocaleString()}</div>
              </div>
            </div>
            <button className="btn-link" onClick={() => navigate('/profile')}>Edit ›</button>
          </motion.div>

          {/* Mode cards — 2 column grid */}
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ModeCard
              title="Duel the Tavernkeep"
              sub="Single player vs the house"
              foot="Three difficulties"
              accent
              onClick={() => navigate('/setup?mode=vs-computer')}
            />
            <ModeCard
              title="Pass & Play"
              sub="Two adventurers, one device"
              foot="Local · Take turns"
              onClick={() => navigate('/setup?mode=local-multiplayer')}
            />
            <ModeCard
              title="Open a Private Table"
              sub="Host a room, share a code"
              foot="Online · 2 players"
              onClick={() => navigate('/lobby?action=create')}
            />
            <ModeCard
              title="Join with a Code"
              sub="Enter a friend's tavern"
              foot="Online · Quick play"
              onClick={() => navigate('/lobby?action=join')}
            />
          </motion.div>

          {/* Flourish divider */}
          <Flourish>Tavern Halls</Flourish>

          {/* Secondary tiles */}
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16, marginBottom: 28 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SecondaryTile title="Champions" sub="Leaderboard" icon="🏆" onClick={() => navigate('/leaderboard')} />
            <SecondaryTile title="Chronicle" sub="Match history" icon="📜" onClick={() => navigate('/history')} />
            <SecondaryTile title="Rules" sub="How to score" icon="📖" onClick={() => navigate('/profile')} />
          </motion.div>

          {/* Quick rules */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickReference />
          </motion.div>

        </div>
      </div>
    </>
  );
}
