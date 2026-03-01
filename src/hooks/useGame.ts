import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { GameState, NewGamePayload } from '../types/game';
import { gameReducer } from '../game/engine';
import { createDice } from '../game/dice';
import { getAIDecision } from '../ai/strategies';
import { ROLL_ANIMATION_MS, AI_MOVE_DELAY_MS } from '../game/constants';

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

export function useGame(initialPayload?: NewGamePayload) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialPayload
      ? buildInitialState(initialPayload)
      : buildInitialState({
          mode: 'vs-computer',
          difficulty: 'medium',
          players: [
            { name: 'Player', avatar: '🎲', isHuman: true },
            { name: 'Computer', avatar: '💀', isHuman: false },
          ],
          targetScore: 10000,
        })
  );

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAiTimer = () => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
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
        const decision = getAIDecision(state, state.difficulty ?? 'medium');

        // Select chosen dice one by one
        decision.selectedDiceIds.forEach((id) => dispatch({ type: 'SELECT_DIE', dieId: id }));

        setTimeout(() => {
          if (decision.action === 'select-and-bank') {
            dispatch({ type: 'BANK' });
          } else {
            dispatch({ type: 'ROLL_MORE' });
            setTimeout(() => dispatch({ type: 'ROLL_COMPLETE' }), ROLL_ANIMATION_MS);
          }
        }, 700);
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
