import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHistory } from '../hooks/useHistory';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { formatDate, formatDuration, formatScore } from '../utils/format';
import type { MatchRecord } from '../types/history';

function MatchRow({ record }: { record: MatchRecord }) {
  const humanPlayer = record.players.find((p) => p.isHuman);
  const humanWon = humanPlayer?.name === record.winnerName;

  return (
    <motion.div
      className="bg-wood border border-wood-light rounded-xl p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span className={`font-cinzel font-bold text-sm px-2 py-0.5 rounded ${humanWon ? 'bg-felt text-gold' : 'bg-danger-dark text-danger-light'}`}>
          {humanWon ? '🏆 Win' : '💀 Loss'}
        </span>
        <span className="text-parchment-dim font-cinzel text-xs">
          {formatDate(record.date)} · {formatDuration(record.durationSeconds)}
        </span>
      </div>

      {/* Players */}
      <div className="flex gap-2 mb-2">
        {record.players.map((p, i) => (
          <div key={i} className="flex-1 bg-wood-darkest/60 rounded-lg p-2 text-center">
            <div className="text-xl">{p.avatar}</div>
            <p className="font-cinzel text-parchment text-xs font-semibold truncate">{p.name}</p>
            <p className={`font-cinzel font-bold tabular-nums ${p.name === record.winnerName ? 'text-gold-bright' : 'text-parchment-dim'}`}>
              {formatScore(p.score)}
            </p>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs font-cinzel text-parchment-dim">
        <span>{record.mode === 'vs-computer' ? 'vs Computer' : 'Local Multiplayer'}</span>
        <span>Target: {formatScore(record.targetScore)}</span>
      </div>
    </motion.div>
  );
}

export function History() {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const { history, historyLoading, wipeHistory } = useHistory();

  return (
    <div className="min-h-screen bg-wood-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>
        <h1 className="font-cinzel font-bold text-gold text-xl">Match History</h1>
        {!isGuest && history.length > 0 ? (
          <button
            onClick={() => {
              if (confirm('Clear all match history?')) wipeHistory();
            }}
            className="text-parchment-dim hover:text-danger font-cinzel text-xs transition-colors"
          >
            Clear
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        {isGuest ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64 gap-5 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-6xl opacity-40">📜</span>
            <div>
              <p className="font-cinzel text-parchment text-base font-semibold mb-1">
                Your tales are unrecorded
              </p>
              <p className="font-cinzel text-parchment-dim text-sm">
                Create an account to save your match history across sessions.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/signup')}>⚔️ Create Account</Button>
            <button
              onClick={() => navigate('/')}
              className="font-cinzel text-parchment-dim text-xs hover:text-parchment transition-colors"
            >
              Return to Tavern
            </button>
          </motion.div>
        ) : historyLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-4xl opacity-40 animate-pulse">📜</span>
            <p className="font-cinzel text-parchment-dim animate-pulse">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-6xl opacity-30">📜</span>
            <p className="font-cinzel text-parchment-dim text-center">
              No matches yet.
              <br />Play a game to see history here!
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Play Now
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-cinzel text-parchment-dim text-sm text-center mb-4">
              {history.length} match{history.length !== 1 ? 'es' : ''} recorded
            </p>
            {history.map((record) => (
              <MatchRow key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
