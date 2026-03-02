import type { GameState, GameAction } from '../types/game';
import {
  rollDice,
  clearRolling,
  lockSelectedDice,
  availableDiceCount,
  createDice,
} from './dice';
import { hasScoringDice, selectionScore, calculateScore } from './scoring';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL': {
      if (state.phase !== 'idle' && state.phase !== 'hot-dice') return state;
      const newDice = rollDice(state.dice);
      return { ...state, phase: 'rolling', dice: newDice, rollCount: state.rollCount + 1 };
    }

    case 'ROLL_MORE': {
      if (state.phase !== 'selecting') return state;
      const selected = state.dice.filter((d) => d.isSelected);
      if (selected.length === 0) return state;
      const selScore = calculateScore(selected.map((d) => d.value)).score;
      if (selScore === 0) return state;

      const newTurnScore = state.turnScore + selScore;
      const lockedDice = lockSelectedDice(state.dice);
      const remaining = availableDiceCount(lockedDice);

      if (remaining === 0) {
        return { ...state, phase: 'hot-dice', dice: lockedDice, turnScore: newTurnScore, selectedScore: 0 };
      }
      const rolledDice = rollDice(lockedDice);
      return {
        ...state,
        phase: 'rolling',
        dice: rolledDice,
        turnScore: newTurnScore,
        selectedScore: 0,
        rollCount: state.rollCount + 1,
      };
    }

    case 'ROLL_COMPLETE': {
      if (state.phase !== 'rolling') return state;
      const unlockedDice = state.dice.filter((d) => !d.isLocked);
      const clearedDice = clearRolling(state.dice);
      const unlockedValues = unlockedDice.map((d) => d.value);

      if (!hasScoringDice(unlockedValues)) {
        return { ...state, phase: 'farkled', dice: clearedDice };
      }
      return { ...state, phase: 'selecting', dice: clearedDice, selectedScore: 0 };
    }

    case 'SELECT_DIE': {
      if (state.phase !== 'selecting') return state;
      const die = state.dice.find((d) => d.id === action.dieId);
      if (!die || die.isLocked) return state;

      const newDice = state.dice.map((d) =>
        d.id === action.dieId ? { ...d, isSelected: !d.isSelected } : d
      );
      return { ...state, dice: newDice, selectedScore: selectionScore(newDice) };
    }

    case 'BANK': {
      if (state.phase !== 'selecting') return state;
      const selected = state.dice.filter((d) => d.isSelected);
      if (selected.length === 0) return state;
      const selScore = calculateScore(selected.map((d) => d.value)).score;
      if (selScore === 0) return state;

      const totalTurnScore = state.turnScore + selScore;
      const newPlayers = state.players.map((p, i) =>
        i !== state.currentPlayerIndex ? p : { ...p, totalScore: p.totalScore + totalTurnScore }
      );

      if (newPlayers[state.currentPlayerIndex].totalScore >= state.targetScore) {
        return {
          ...state,
          phase: 'game-over',
          players: newPlayers,
          winner: state.currentPlayerIndex,
          dice: clearRolling(lockSelectedDice(state.dice)),
        };
      }

      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        ...state,
        phase: 'idle',
        players: newPlayers,
        currentPlayerIndex: nextIndex,
        dice: createDice(),
        turnScore: 0,
        selectedScore: 0,
        rollCount: 0,
        showPassDevice: state.mode === 'local-multiplayer',
      };
    }

    case 'CONFIRM_FARKLE': {
      if (state.phase !== 'farkled') return state;
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        ...state,
        phase: 'idle',
        currentPlayerIndex: nextIndex,
        dice: createDice(),
        turnScore: 0,
        selectedScore: 0,
        rollCount: 0,
        showPassDevice: state.mode === 'local-multiplayer',
      };
    }

    case 'CONFIRM_HOT_DICE': {
      if (state.phase !== 'hot-dice') return state;
      return { ...state, phase: 'idle', dice: createDice(), selectedScore: 0 };
    }

    case 'CONFIRM_PASS': {
      return { ...state, showPassDevice: false };
    }

    case 'SYNC_REMOTE_STATE':
      return action.state;

    case 'NEW_GAME': {
      const { payload } = action as GameAction & { payload: any };
      return {
        phase: 'idle',
        currentPlayerIndex: 0,
        players: payload.players.map((p: any, i: number) => ({
          id: p.id ?? `player-${i}`,
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

    default:
      return state;
  }
}

export type { GameState };
