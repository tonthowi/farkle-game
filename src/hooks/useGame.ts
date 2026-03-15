import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, NewGamePayload } from '../types/game';
import { gameReducer } from '../game/engine';
import { createDice } from '../game/dice';
import { getAIDecision } from '../ai/strategies';
import { ROLL_ANIMATION_MS, AI_MOVE_DELAY_MS, AI_SELECT_DELAY_MS } from '../game/constants';

function buildInitialState(payload: NewGamePayload): GameState {
  return {
    phase: 'idle',
    currentPlayerIndex: 0,
    players: payload.players.map((p, i) => ({
      id: `player-${i}`,
      name: p.name,
      avatar: p.avatar,
      totalScore: 0,
      isHuman: p.isHuman,
    })),
    dice: createDice(),
    turnScore: 0,
    selectedScore: 0,
    rollCount: 0,
    mode: payload.mode,
    difficulty: payload.difficulty,
    targetScore: payload.targetScore,
    winner: null,
    startTime: Date.now(),
    showPassDevice: false,
  };
}

export function useGame(initialPayload?: NewGamePayload, initialState?: GameState) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState ??
      (initialPayload
        ? buildInitialState(initialPayload)
        : buildInitialState({
            mode: 'vs-computer',
            difficulty: 'medium',
            players: [
              { name: 'Player', avatar: '🎲', isHuman: true },
              { name: 'Computer', avatar: '💀', isHuman: false },
            ],
            targetScore: 10000,
          }))
  );

  // Always-current state ref — lets AI callbacks read fresh dice/score without
  // adding them to the effect deps (which would re-trigger on every SELECT_DIE).
  const stateRef = useRef(state);
  stateRef.current = state;

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiInnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAiTimer = () => {
    if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
    if (aiInnerTimerRef.current) { clearTimeout(aiInnerTimerRef.current); aiInnerTimerRef.current = null; }
    if (aiRollTimerRef.current) { clearTimeout(aiRollTimerRef.current); aiRollTimerRef.current = null; }
  };

  const triggerRoll = useCallback(() => {
    dispatch({ type: 'ROLL' });
    setTimeout(() => dispatch({ type: 'ROLL_COMPLETE' }), ROLL_ANIMATION_MS);
  }, []);

  const triggerRollMore = useCallback(() => {
    dispatch({ type: 'ROLL_MORE' });
    setTimeout(() => dispatch({ type: 'ROLL_COMPLETE' }), ROLL_ANIMATION_MS);
  }, []);

  const selectDie = useCallback((dieId: number) => {
    dispatch({ type: 'SELECT_DIE', dieId });
  }, []);

  const bank = useCallback(() => {
    dispatch({ type: 'BANK' });
  }, []);

  const confirmFarkle = useCallback(() => {
    dispatch({ type: 'CONFIRM_FARKLE' });
  }, []);

  const confirmHotDice = useCallback(() => {
    dispatch({ type: 'CONFIRM_HOT_DICE' });
  }, []);

  const confirmPass = useCallback(() => {
    dispatch({ type: 'CONFIRM_PASS' });
  }, []);

  const startNewGame = useCallback((payload: NewGamePayload) => {
    clearAiTimer();
    dispatch({ type: 'NEW_GAME', payload });
  }, []);

  // AI automation
  useEffect(() => {
    clearAiTimer();

    if (state.phase === 'game-over') return;
    if (state.mode !== 'vs-computer') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

    if (state.phase === 'idle') {
      aiTimerRef.current = setTimeout(() => {
        dispatch({ type: 'ROLL' });
        setTimeout(() => dispatch({ type: 'ROLL_COMPLETE' }), ROLL_ANIMATION_MS);
      }, AI_MOVE_DELAY_MS);
    }

    if (state.phase === 'selecting') {
      aiTimerRef.current = setTimeout(() => {
        // Read from ref so we get fresh dice/turnScore without them being deps
        const snap = stateRef.current;
        const difficulty = snap.difficulty ?? 'medium';
        const decision = getAIDecision(snap, difficulty);

        // Select chosen dice one by one
        decision.selectedDiceIds.forEach((id) => dispatch({ type: 'SELECT_DIE', dieId: id }));

        aiInnerTimerRef.current = setTimeout(() => {
          if (decision.action === 'select-and-bank') {
            dispatch({ type: 'BANK' });
          } else {
            dispatch({ type: 'ROLL_MORE' });
            setTimeout(() => dispatch({ type: 'ROLL_COMPLETE' }), ROLL_ANIMATION_MS);
          }
        }, AI_SELECT_DELAY_MS);
      }, AI_MOVE_DELAY_MS);
    }

    if (state.phase === 'farkled') {
      aiTimerRef.current = setTimeout(() => dispatch({ type: 'CONFIRM_FARKLE' }), AI_MOVE_DELAY_MS);
    }

    if (state.phase === 'hot-dice') {
      aiTimerRef.current = setTimeout(() => dispatch({ type: 'CONFIRM_HOT_DICE' }), AI_MOVE_DELAY_MS);
    }

    return clearAiTimer;
  }, [state.phase, state.currentPlayerIndex, state.mode]);

  const isCurrentPlayerHuman =
    state.players[state.currentPlayerIndex]?.isHuman ?? false;

  return {
    state,
    dispatch,
    startNewGame,
    triggerRoll,
    triggerRollMore,
    selectDie,
    bank,
    confirmFarkle,
    confirmHotDice,
    confirmPass,
    isCurrentPlayerHuman,
  };
}
