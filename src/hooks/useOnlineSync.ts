import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState, GameAction } from '../types/game';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

interface OnlineSyncOptions {
  roomCode: string | undefined;
  isOnlineMode: boolean;
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onFatalError: () => void;
}

interface BaseActions {
  triggerRoll: () => void;
  triggerRollMore: () => void;
  bank: () => void;
  selectDie: (id: number) => void;
  confirmFarkle: () => void;
  confirmHotDice: () => void;
}

export interface WrappedActions {
  isConnected: boolean;
  handleRoll: () => void;
  handleRollMore: () => void;
  handleBank: () => void;
  handleSelectDie: (id: number) => void;
  handleConfirmFarkle: () => void;
  handleConfirmHotDice: () => void;
}

export function useOnlineSync(
  { roomCode, isOnlineMode, state, dispatch, onFatalError }: OnlineSyncOptions,
  baseActions: BaseActions
): WrappedActions {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingBroadcastRef = useRef(false);
  const [isConnected, setIsConnected] = useState(true);
  const channelErrorCountRef = useRef(0);
  // Stable ref to onFatalError so it doesn't appear in effect deps
  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;

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
        channelErrorCountRef.current = 0;
        setIsConnected(true);
        log.info(`Room channel ${roomCode} connected`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        channelErrorCountRef.current += 1;
        setIsConnected(false);
        log.error(`Channel error [${status}] (${channelErrorCountRef.current}/3)`, err);
        if (channelErrorCountRef.current >= 3) {
          log.warn('Too many channel errors — returning to home');
          onFatalErrorRef.current();
        }
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
  }, [isOnlineMode, roomCode, dispatch]);

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

  function markBroadcast() {
    if (isOnlineMode) pendingBroadcastRef.current = true;
  }

  return {
    isConnected,
    handleRoll: () => { markBroadcast(); baseActions.triggerRoll(); },
    handleRollMore: () => { markBroadcast(); baseActions.triggerRollMore(); },
    handleBank: () => { markBroadcast(); baseActions.bank(); },
    handleSelectDie: (id: number) => { markBroadcast(); baseActions.selectDie(id); },
    handleConfirmFarkle: () => { markBroadcast(); baseActions.confirmFarkle(); },
    handleConfirmHotDice: () => { markBroadcast(); baseActions.confirmHotDice(); },
  };
}
