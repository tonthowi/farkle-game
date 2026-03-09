import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState, NewGamePayload } from '../types/game';
import type { MatchRecord } from '../types/history';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import { useHistory } from '../hooks/useHistory';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { ScorePanel } from '../components/game/ScorePanel';
import { TurnPanel } from '../components/game/TurnPanel';
import { DiceBoard } from '../components/dice/DiceBoard';
import { GameActions } from '../components/game/GameActions';
import { FarkleAlert } from '../components/game/FarkleAlert';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatScore } from '../utils/format';

export function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as any;
  const { user } = useAuth();
  const { updateStats } = useProfile();
  const { recordMatch } = useHistory();

  // Detect online multiplayer
  const isOnlineMode = locationState?.mode === 'online-multiplayer';
  const roomCode = isOnlineMode ? (locationState?.roomCode as string | undefined) : undefined;

  // For online mode, locationState IS the full GameState.
  // For other modes, build from NewGamePayload.
  const onlineInitialState: GameState | undefined = isOnlineMode
    ? (locationState as GameState)
    : undefined;

  const offlinePayload: NewGamePayload = isOnlineMode
    ? { mode: 'vs-computer', players: [], targetScore: 10000 } // unused
    : (locationState as NewGamePayload ?? {
        mode: 'vs-computer',
        difficulty: 'medium',
        players: [
          { name: 'Player', avatar: '🎲', isHuman: true },
          { name: 'Computer', avatar: '💀', isHuman: false },
        ],
        targetScore: 10000,
      });

  const {
    state,
    dispatch,
    triggerRoll,
    triggerRollMore,
    selectDie,
    bank,
    confirmFarkle,
    confirmHotDice,
    confirmPass,
    startNewGame,
    isCurrentPlayerHuman,
  } = useGame(isOnlineMode ? undefined : offlinePayload, onlineInitialState);

  // For online mode, ownership is determined by the player's UUID.
  // For offline modes, use the existing isCurrentPlayerHuman flag.
  const isMyTurn = isOnlineMode
    ? state.players[state.currentPlayerIndex]?.id === user?.id
    : isCurrentPlayerHuman;

  // ── Realtime Broadcast channel ───────────────────────────────
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Set to true before any local dispatch so we know to broadcast after state updates.
  const pendingBroadcastRef = useRef(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!isOnlineMode || !roomCode) return;

    const ch = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'state_update' }, ({ payload: p }) => {
      dispatch({ type: 'SYNC_REMOTE_STATE', state: p.state as GameState });
    });

    ch.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        log.info(`Room channel ${roomCode} connected`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setIsConnected(false);
        log.error(`Channel error [${status}]`, err);
      } else if (status === 'CLOSED') {
        setIsConnected(false);
        log.warn('Channel closed');
      }
    });
    channelRef.current = ch;

    return () => {
      void supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [isOnlineMode, roomCode]);

  // Broadcast after every local state change (skip rolling phase; wait for animation)
  useEffect(() => {
    if (!isOnlineMode || !channelRef.current) return;
    if (!pendingBroadcastRef.current) return;
    if (state.phase === 'rolling') return;
    pendingBroadcastRef.current = false;
    void channelRef.current.send({
      type: 'broadcast',
      event: 'state_update',
      payload: { state },
    }).then((status) => {
      if (status !== 'ok') log.warn('Broadcast send failed:', status);
    });
  }, [state, isOnlineMode]);

  // Mark room as finished when game ends
  useEffect(() => {
    if (!isOnlineMode || state.phase !== 'game-over' || !roomCode) return;
    supabase.from('rooms').update({ status: 'finished' }).eq('code', roomCode).then(() => {});
  }, [state.phase, isOnlineMode, roomCode]);

  // ── Wrapped local-action dispatchers ─────────────────────────
  function handleRoll() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    triggerRoll();
  }
  function handleRollMore() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    triggerRollMore();
  }
  function handleBank() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    bank();
  }
  function handleSelectDie(id: number) {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    selectDie(id);
  }
  function handleConfirmFarkle() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    confirmFarkle();
  }
  function handleConfirmHotDice() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
    confirmHotDice();
  }

  // ── Save match result when game ends ─────────────────────────
  useEffect(() => {
    if (state.phase !== 'game-over' || state.winner === null) return;

    const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const winnerPlayer = state.players[state.winner];

    // For online mode, each player independently records their own result.
    const humanPlayer = isOnlineMode
      ? (state.players.find((p) => p.id === user?.id) ?? null)
      : (state.players.find((p) => p.isHuman) ?? null);
    const humanWon = humanPlayer !== null && state.players[state.winner]?.id === humanPlayer.id;

    const record: MatchRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode: state.mode,
      players: state.players.map((p) => ({
        name: p.name,
        avatar: p.avatar,
        score: p.totalScore,
        isHuman: isOnlineMode ? p.id === user?.id : p.isHuman,
      })),
      winnerName: winnerPlayer?.name ?? 'Unknown',
      durationSeconds,
      targetScore: state.targetScore,
    };
    if (!user?.is_anonymous) {
      recordMatch(record);
    }

    if (humanPlayer) {
      updateStats((prev: any) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + (humanWon ? 1 : 0),
        losses: prev.losses + (humanWon ? 0 : 1),
        bestScore: Math.max(prev.bestScore, humanPlayer.totalScore),
        totalPointsScored: prev.totalPointsScored + humanPlayer.totalScore,
      }));
    }
  }, [state.phase]);

  const winner = state.winner !== null ? state.players[state.winner] : null;

  return (
    <div className="min-h-screen flex flex-col bg-wood-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wood-light">
        <button
          onClick={() => navigate('/')}
          className="text-parchment-dim hover:text-gold font-cinzel text-sm transition-colors"
        >
          ‹ Quit
        </button>
        <h1 className="font-cinzel text-gold font-bold tracking-wider">FARKLE</h1>
        <div className="text-parchment-dim font-cinzel text-xs">
          {state.mode === 'vs-computer'
            ? `vs ${state.difficulty}`
            : state.mode === 'online-multiplayer'
            ? '🌐 Online'
            : 'Local'}
        </div>
      </div>

      {/* Connection lost banner — online only */}
      {isOnlineMode && !isConnected && (
        <div className="bg-danger/90 text-parchment-bright font-cinzel text-xs text-center py-2 px-4">
          Connection lost — attempting to reconnect…
        </div>
      )}

      {/* Opponent's turn banner — online only */}
      {isOnlineMode && !isMyTurn && state.phase !== 'game-over' && (
        <motion.div
          className="bg-wood border-b border-wood-light px-4 py-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="font-cinzel text-parchment-dim text-xs">
            ⏳ {state.players[state.currentPlayerIndex]?.avatar}{' '}
            {state.players[state.currentPlayerIndex]?.name}'s turn — please wait…
          </p>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col gap-4 p-4 max-w-md mx-auto w-full">
        <ScorePanel
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          targetScore={state.targetScore}
        />

        <TurnPanel state={state} />

        <DiceBoard
          dice={state.dice}
          onSelectDie={handleSelectDie}
          canSelect={state.phase === 'selecting' && isMyTurn}
          phase={state.phase}
        />

        <GameActions
          state={state}
          onRoll={handleRoll}
          onRollMore={handleRollMore}
          onBank={handleBank}
          isHumanTurn={isMyTurn}
        />
      </div>

      {/* Farkle alert */}
      <FarkleAlert
        state={state}
        onConfirm={handleConfirmFarkle}
        isHumanTurn={isMyTurn}
      />

      {/* Hot Dice modal */}
      <Modal open={state.phase === 'hot-dice' && isMyTurn} title="🔥 Hot Dice!">
        <p className="font-cinzel text-parchment text-center mb-4">
          All dice scored! You must roll all 6 dice again.
        </p>
        <p className="font-cinzel text-gold text-center text-lg font-bold mb-6">
          Turn score: {formatScore(state.turnScore)}
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={handleConfirmHotDice}>
          Roll All 6!
        </Button>
      </Modal>

      {/* Pass device modal — local multiplayer only */}
      {!isOnlineMode && (
        <Modal open={state.showPassDevice} title="Pass the Device">
          <p className="font-cinzel text-parchment text-center mb-2">
            {state.players[(state.currentPlayerIndex + state.players.length) % state.players.length]?.name}'s turn is over.
          </p>
          <p className="font-cinzel text-gold text-center text-lg mb-6">
            Pass to{' '}
            <span className="font-bold">
              {state.players[state.currentPlayerIndex]?.name}
            </span>
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={confirmPass}>
            I'm Ready ›
          </Button>
        </Modal>
      )}

      {/* Game over modal */}
      <AnimatePresence>
        {state.phase === 'game-over' && winner && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-wood border-2 border-gold rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 15, -15, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                {winner.avatar}
              </motion.div>
              <h2 className="font-cinzel font-black text-gold text-4xl mb-1">Victory!</h2>
              <p className="font-cinzel text-parchment text-xl mb-1">{winner.name} wins!</p>
              <p className="font-cinzel text-parchment-dim mb-6">
                Final score: {formatScore(winner.totalScore)}
              </p>

              <div className="space-y-2 mb-6">
                {state.players.map((p) => (
                  <div key={p.id} className="flex justify-between items-center px-2">
                    <span className="font-cinzel text-parchment">
                      {p.avatar} {p.name}
                    </span>
                    <span className={`font-cinzel font-bold tabular-nums ${p === winner ? 'text-gold-bright' : 'text-parchment-dim'}`}>
                      {formatScore(p.totalScore)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                  Menu
                </Button>
                {/* Rematch only in offline modes */}
                {!isOnlineMode && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => startNewGame(offlinePayload)}
                  >
                    Rematch
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
