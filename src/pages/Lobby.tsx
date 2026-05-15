import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';
import { BrandMark } from '../components/ui/BrandMark';
import { createDice } from '../game/dice';
import type { GameState } from '../types/game';

type LobbyPhase = 'choose' | 'creating' | 'waiting-host' | 'joining' | 'waiting-guest';

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function Lobby() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const initialAction = params.get('action') as 'create' | 'join' | null;

  const [phase, setPhase] = useState<LobbyPhase>(() => {
    if (initialAction === 'join') return 'joining';
    return 'choose';
  });
  const [roomCode, setRoomCode] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [guestJoined, setGuestJoined] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);

  // Keep a ref so subscription callbacks always see the latest phase
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const doCreateRoom = useCallback(async () => {
    if (!user) return;
    setCreateError('');
    setPhase('creating');

    const tryInsert = async (code: string) =>
      supabase.from('rooms').insert({ code, host_id: user.id }).select().single();

    let data = null;
    let finalCode = generateCode();
    let { data: d1, error: e1 } = await tryInsert(finalCode);
    if (e1 || !d1) {
      // Retry once with a new code (collision guard)
      finalCode = generateCode();
      const { data: d2, error: e2 } = await tryInsert(finalCode);
      if (e2 || !d2) {
        setCreateError('Could not create room. Please try again.');
        setPhase('choose');
        return;
      }
      data = d2;
    } else {
      data = d1;
    }

    setRoomCode(finalCode);
    setRoomId(data.id);
    setPhase('waiting-host');
  }, [user]);

  // Auto-create if URL param is 'create'
  useEffect(() => {
    if (initialAction === 'create') {
      doCreateRoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to room changes while waiting as host.
  // Uses Realtime + fallback polling so the host always detects the guest.
  useEffect(() => {
    if (phase !== 'waiting-host' || !roomId) return;

    let cancelled = false;

    // Shared handler — works for Realtime callback, immediate check, and polling
    async function checkForGuest() {
      const { data } = await supabase
        .from('rooms')
        .select('guest_id, status')
        .eq('id', roomId)
        .single();

      if (cancelled || !data?.guest_id) return;

      const { data: gd } = await supabase
        .from('profiles')
        .select('username, avatar')
        .eq('id', data.guest_id)
        .single();

      if (cancelled) return;

      setGuestInfo({ name: gd?.username ?? 'Guest', avatar: gd?.avatar ?? '🎲' });
      setGuestJoined(true);
    }

    // 1. Immediate check (guest may have joined before subscription connected)
    checkForGuest();

    // 2. Realtime subscription
    const ch = supabase
      .channel(`room-host:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => { checkForGuest(); }
      )
      .subscribe((status) => {
        log.info('Host subscription status:', status);
      });

    // 3. Fallback polling every 3 seconds
    const poll = setInterval(checkForGuest, 3000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, [roomId, phase]);

  // Subscribe to room changes while waiting as guest
  useEffect(() => {
    if (phase !== 'waiting-guest' || !roomId) return;

    // Check current status immediately (in case we missed the update)
    supabase
      .from('rooms')
      .select('status, game_state, code')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data?.status === 'playing' && data.game_state) {
          navigate('/game', {
            state: { ...(data.game_state as GameState), roomCode: data.code },
            replace: true,
          });
        }
      });

    const ch = supabase
      .channel(`room-guest:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as { status: string; game_state: GameState | null; code: string };
          if (row.status === 'playing' && row.game_state) {
            navigate('/game', {
              state: { ...row.game_state, roomCode: row.code },
              replace: true,
            });
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(ch); };
  }, [roomId, phase, navigate]);

  async function handleJoin() {
    if (!user || !joinInput.trim()) return;
    setJoinError('');

    const code = joinInput.trim().toUpperCase();
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .eq('status', 'waiting')
      .single();

    if (error || !data) {
      setJoinError('Room not found. Check the code and try again.');
      return;
    }
    if (data.host_id === user.id) {
      setJoinError("That's your own room! Share the code with a friend.");
      return;
    }

    const { error: upErr } = await supabase
      .from('rooms')
      .update({ guest_id: user.id, status: 'ready' })
      .eq('id', data.id);

    if (upErr) {
      setJoinError('Could not join room. It may already be full.');
      return;
    }

    setRoomId(data.id);
    setRoomCode(data.code);
    setPhase('waiting-guest');
  }

  async function handleStartGame() {
    if (!user || !roomId || !guestJoined || isStarting) return;
    setIsStarting(true);

    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!room) { setIsStarting(false); return; }

    const [hostRes, guestRes] = await Promise.all([
      supabase.from('profiles').select('username, avatar').eq('id', user.id).single(),
      supabase.from('profiles').select('username, avatar').eq('id', room.guest_id).single(),
    ]);

    if (hostRes.error || guestRes.error) {
      log.error('Profile fetch failed in handleStartGame', hostRes.error ?? guestRes.error);
      setCreateError('Could not load player profiles. Please try again.');
      setIsStarting(false);
      return;
    }

    const gameState: GameState = {
      phase: 'idle',
      currentPlayerIndex: 0,
      players: [
        {
          id: user.id,
          name: hostRes.data?.username ?? 'Host',
          avatar: hostRes.data?.avatar ?? '🎲',
          totalScore: 0,
          isHuman: true,
        },
        {
          id: room.guest_id,
          name: guestRes.data?.username ?? 'Guest',
          avatar: guestRes.data?.avatar ?? '🎲',
          totalScore: 0,
          isHuman: true,
        },
      ],
      dice: createDice(),
      turnScore: 0,
      selectedScore: 0,
      rollCount: 0,
      mode: 'online-multiplayer',
      targetScore: room.target_score,
      winner: null,
      startTime: Date.now(),
      showPassDevice: false,
      turnDeadline: null,
      roomCode,
    };

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ game_state: gameState, status: 'playing' })
      .eq('id', roomId);

    if (updateError) {
      log.error('Room update failed:', updateError.message);
      setCreateError('Failed to start game. Please try again.');
      setIsStarting(false);
      return;
    }

    navigate('/game', { state: gameState, replace: true });
  }

  async function handleCancelHost() {
    if (roomId) {
      await supabase.from('rooms').delete().eq('id', roomId);
    }
    navigate('/');
  }

  async function handleLeaveGuest() {
    if (roomId) {
      await supabase
        .from('rooms')
        .update({ guest_id: null, status: 'waiting' })
        .eq('id', roomId);
    }
    navigate('/');
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ──────────────────────────────────────────────────

  if (phase === 'choose') {
    return (
      <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
        <div className="candle-glow" />
        <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
          <button className="btn-link" onClick={() => navigate('/')}>‹ Back</button>
          <BrandMark small />
          <div className="w-12" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div style={{ fontSize: 11, color: '#7a6a4b', letterSpacing: '0.36em', fontFamily: 'Cinzel', textTransform: 'uppercase', marginBottom: 8 }}>✦ Online Play ✦</div>
            <p className="font-cinzel text-parchment-dim text-sm mt-1">
              Challenge a friend across any device
            </p>
          </div>

          {createError && (
            <p className="font-cinzel text-xs text-center panel px-3 py-2" style={{ color: '#ff9a9a', borderColor: '#b13838' }}>
              {createError}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button className="btn-gold w-full" onClick={doCreateRoom}>🏰 Open a Private Table</button>
            <button className="btn-ghost w-full" onClick={() => setPhase('joining')}>🔗 Join with a Code</button>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  if (phase === 'creating') {
    return (
      <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
        <div className="candle-glow" />
        <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
          <BrandMark small />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-5xl mb-4 animate-pulse">🎲</div>
            <p className="font-cinzel text-parchment-dim" style={{ letterSpacing: '0.1em' }}>Preparing the table…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === 'waiting-host') {
    return (
      <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
        <div className="candle-glow" />
        <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
          <button className="btn-link" onClick={handleCancelHost}>‹ Cancel</button>
          <BrandMark small />
          <div className="w-16" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full flex flex-col gap-5"
          style={{ maxWidth: 380 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* "Seal of the Table" room code panel */}
          <div className="panel text-center" style={{ padding: '28px 24px' }}>
            <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>
              ✦ Seal of the Table ✦
            </div>
            <div className="font-cinzel" style={{ fontSize: 42, fontWeight: 900, color: '#f3d989', letterSpacing: '0.25em', marginBottom: 16, textShadow: '0 0 20px rgba(243,217,137,0.3)' }}>
              {roomCode}
            </div>
            <button className="btn-link" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy code'}
            </button>
          </div>

          {/* Guest status */}
          <div className="panel p-4 text-center">
            {guestJoined && guestInfo ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-3xl mb-1">{guestInfo.avatar}</p>
                <p className="font-cinzel text-parchment font-semibold">{guestInfo.name}</p>
                <p className="font-cinzel text-parchment-dim text-xs">has entered the tavern!</p>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#c9994a' }} />
                <p className="font-cinzel text-parchment-dim text-sm">Waiting for opponent…</p>
              </div>
            )}
          </div>

          <button
            className="btn-gold w-full"
            onClick={handleStartGame}
            disabled={!guestJoined || isStarting}
          >
            {isStarting ? 'Starting…' : guestJoined ? '⚔️ Start Game' : 'Waiting for player…'}
          </button>
        </motion.div>
        </div>
      </div>
    );
  }

  if (phase === 'joining') {
    return (
      <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
        <div className="candle-glow" />
        <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
          <button className="btn-link" onClick={() => navigate('/')}>‹ Back</button>
          <BrandMark small />
          <div className="w-12" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full flex flex-col gap-5"
          style={{ maxWidth: 380 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="font-cinzel" style={{ fontSize: 11, color: '#7a6a4b', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>✦ Join with a Code ✦</div>
            <p className="font-cinzel text-parchment-dim text-sm">
              Enter the 6-character code from your opponent
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              placeholder="FKL123"
              style={{
                width: '100%',
                background: 'rgba(10,6,3,0.6)',
                border: '1px solid #7a5a1f',
                borderRadius: 3,
                padding: '12px 16px',
                color: '#f3d989',
                fontFamily: "'Cinzel', serif",
                fontSize: 28,
                textAlign: 'center',
                letterSpacing: '0.25em',
                outline: 'none',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#e8c374')}
              onBlur={(e) => (e.target.style.borderColor = '#7a5a1f')}
            />

            {joinError && (
              <p className="font-cinzel text-xs text-center panel px-3 py-2 mb-3" style={{ color: '#ff9a9a', borderColor: '#b13838' }}>
                {joinError}
              </p>
            )}

            <button
              className="btn-gold w-full"
              onClick={handleJoin}
              disabled={joinInput.length < 6}
            >
              🔗 Enter the Tavern
            </button>
          </div>

          <button className="btn-link" style={{ textAlign: 'center', margin: '0 auto' }} onClick={() => setPhase('choose')}>
            ‹ Back
          </button>
        </motion.div>
        </div>
      </div>
    );
  }

  // phase === 'waiting-guest'
  return (
    <div className="bg-oak min-h-screen flex flex-col" style={{ position: 'relative' }}>
      <div className="candle-glow" />
      <div className="flex items-center justify-between p-4 relative" style={{ borderBottom: '1px solid #2b2118' }}>
        <button className="btn-link" onClick={handleLeaveGuest}>‹ Leave</button>
        <BrandMark small />
        <div className="w-12" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full flex flex-col gap-5 text-center"
          style={{ maxWidth: 380 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="font-cinzel" style={{ fontSize: 11, color: '#7a6a4b', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            ✦ Awaiting the Host ✦
          </div>

          <div className="panel text-center" style={{ padding: '28px 24px' }}>
            <div className="font-cinzel" style={{ fontSize: 10, color: '#7a6a4b', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 10 }}>
              ✦ Seal of the Table ✦
            </div>
            <div className="font-cinzel" style={{ fontSize: 36, fontWeight: 900, color: '#f3d989', letterSpacing: '0.25em', marginBottom: 16 }}>
              {roomCode}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#c9994a' }} />
              <p className="font-cinzel text-parchment-dim text-sm">Host is preparing the table…</p>
            </div>
          </div>

          <p className="font-cinzel text-parchment-dim" style={{ fontSize: 11 }}>
            The game will begin automatically when the host starts it.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
