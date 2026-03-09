import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { createDice } from '../game/dice';
import type { GameState } from '../types/game';

type LobbyPhase = 'choose' | 'creating' | 'waiting-host' | 'joining' | 'waiting-guest';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
      <div className="min-h-screen bg-wood-dark flex flex-col items-center justify-center p-6">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>

        <motion.div
          className="w-full max-w-sm flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🏰</div>
            <h1 className="font-cinzel font-black text-gold text-3xl tracking-wider">Online Play</h1>
            <p className="font-cinzel text-parchment-dim text-sm mt-1">
              Challenge a friend across any device
            </p>
          </div>

          {createError && (
            <p className="font-cinzel text-danger-light text-xs text-center bg-danger-dark/30 border border-danger rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full" onClick={doCreateRoom}>
              🏰 Create Room
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => setPhase('joining')}>
              🔗 Join Room
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'creating') {
    return (
      <div className="min-h-screen bg-wood-dark flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-5xl mb-4 animate-pulse">🎲</div>
          <p className="font-cinzel text-parchment-dim">Creating room…</p>
        </motion.div>
      </div>
    );
  }

  if (phase === 'waiting-host') {
    return (
      <div className="min-h-screen bg-wood-dark flex flex-col items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🏰</div>
            <h1 className="font-cinzel font-black text-gold text-2xl">Room Created</h1>
            <p className="font-cinzel text-parchment-dim text-sm mt-1">
              Share this code with your opponent
            </p>
          </div>

          {/* Room code display */}
          <div className="bg-wood border border-wood-light rounded-xl p-6 text-center">
            <p className="font-cinzel text-parchment-dim text-xs uppercase tracking-widest mb-2">Join Code</p>
            <p className="font-cinzel font-black text-gold text-5xl tracking-[0.25em] mb-4">
              {roomCode}
            </p>
            <button
              onClick={handleCopy}
              className="font-cinzel text-parchment-dim text-xs hover:text-gold transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy code'}
            </button>
          </div>

          {/* Guest status */}
          <div className="bg-wood border border-wood-light rounded-xl p-4 text-center">
            {guestJoined && guestInfo ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-3xl mb-1">{guestInfo.avatar}</p>
                <p className="font-cinzel text-parchment font-semibold">{guestInfo.name}</p>
                <p className="font-cinzel text-parchment-dim text-xs">has joined the room!</p>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-gold rounded-full animate-pulse" />
                <p className="font-cinzel text-parchment-dim text-sm">Waiting for opponent…</p>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStartGame}
            disabled={!guestJoined || isStarting}
          >
            {isStarting ? 'Starting…' : guestJoined ? '⚔️ Start Game' : 'Waiting for player…'}
          </Button>

          <button
            onClick={handleCancelHost}
            className="font-cinzel text-parchment-dim text-sm text-center hover:text-danger transition-colors"
          >
            Cancel &amp; close room
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'joining') {
    return (
      <div className="min-h-screen bg-wood-dark flex flex-col items-center justify-center p-6">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Back
        </button>

        <motion.div
          className="w-full max-w-sm flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🔗</div>
            <h1 className="font-cinzel font-black text-gold text-2xl">Join Room</h1>
            <p className="font-cinzel text-parchment-dim text-sm mt-1">
              Enter the 6-character code from your opponent
            </p>
          </div>

          <div className="bg-wood border border-wood-light rounded-xl p-5 space-y-4">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              placeholder="FKL123"
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-3 text-parchment font-cinzel text-2xl text-center tracking-[0.25em] focus:outline-none focus:border-gold uppercase"
            />

            {joinError && (
              <p className="font-cinzel text-danger-light text-xs text-center bg-danger-dark/30 border border-danger rounded-lg px-3 py-2">
                {joinError}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={joinInput.length < 6}
            >
              🔗 Join Game
            </Button>
          </div>

          <button
            onClick={() => setPhase('choose')}
            className="font-cinzel text-parchment-dim text-sm text-center hover:text-gold transition-colors"
          >
            ‹ Back
          </button>
        </motion.div>
      </div>
    );
  }

  // phase === 'waiting-guest'
  return (
    <div className="min-h-screen bg-wood-dark flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm flex flex-col gap-5 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="text-5xl mb-2 animate-pulse">⏳</div>
          <h1 className="font-cinzel font-black text-gold text-2xl">Joined Room</h1>
          <p className="font-cinzel text-parchment-dim text-sm mt-1">
            Code: <span className="text-gold font-bold tracking-widest">{roomCode}</span>
          </p>
        </div>

        <div className="bg-wood border border-wood-light rounded-xl p-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 bg-gold rounded-full animate-pulse" />
            <p className="font-cinzel text-parchment text-sm">Waiting for host to start…</p>
          </div>
          <p className="font-cinzel text-parchment-dim text-xs">
            The game will begin automatically when the host starts it.
          </p>
        </div>

        <button
          onClick={handleLeaveGuest}
          className="font-cinzel text-parchment-dim text-sm hover:text-danger transition-colors"
        >
          Leave room
        </button>
      </motion.div>
    </div>
  );
}
