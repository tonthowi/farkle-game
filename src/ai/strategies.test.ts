import { describe, it, expect } from 'vitest';
import type { GameState, Die, DieValue, PlayerState } from '../types/game';
import { getAIDecision } from './strategies';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeDie(id: number, value: DieValue, isLocked = false): Die {
  return { id, value, isSelected: false, isLocked, isRolling: false };
}

function makePlayer(totalScore: number, isHuman = false): PlayerState {
  return { id: `p${totalScore}`, name: 'Player', avatar: '🎲', totalScore, isHuman };
}

function makeState({ dice, ...rest }: Partial<GameState> & { dice: Die[] }): GameState {
  return {
    phase: 'selecting',
    currentPlayerIndex: 0,
    players: [makePlayer(0, false), makePlayer(0, true)],
    dice,
    turnScore: 0,
    selectedScore: 0,
    rollCount: 1,
    mode: 'vs-computer',
    difficulty: 'easy',
    targetScore: 10000,
    winner: null,
    startTime: Date.now(),
    showPassDevice: false,
    turnDeadline: null,
    ...rest,
  };
}

// ─── Easy strategy ───────────────────────────────────────────────────────────

describe('easy strategy', () => {
  it('banks when accumulated score reaches 300', () => {
    // Die 1 shows 1 (100 pts) + turnScore 200 → totalIfBanked = 300
    // Three non-scoring dice remain after locking so hot-dice path is NOT triggered
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 4), makeDie(4, 6)];
    const state = makeState({ dice, turnScore: 200 });
    const decision = getAIDecision(state, 'easy');
    expect(decision.action).toBe('select-and-bank');
    expect(decision.selectedDiceIds).toContain(1);
  });

  it('rolls when score is below 300 and dice remaining > 2', () => {
    // One die showing 1 (100 pts) + turnScore 0 → totalIfBanked = 100
    // But only 1 die left → diceLeftAfterLock = 0 → hot dice path!
    // Use 5 dice: 1 scores, 4 remaining
    const dice = [
      makeDie(1, 1),
      makeDie(2, 2),
      makeDie(3, 3),
      makeDie(4, 4),
      makeDie(5, 6),
    ];
    const state = makeState({ dice, turnScore: 0 });
    const decision = getAIDecision(state, 'easy');
    expect(decision.action).toBe('select-and-roll');
  });

  it('banks when ≤ 2 dice remain after locking', () => {
    // Three dice total: 1 scoring die + 2 non-scoring → 2 dice left, threshold kicks in
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3)];
    const state = makeState({ dice, turnScore: 0 });
    const decision = getAIDecision(state, 'easy');
    // diceLeftAfterLock = 2 → shouldBank = true
    expect(decision.action).toBe('select-and-bank');
  });

  it('rolls all dice on hot dice (all dice lock)', () => {
    // Single die showing 1 → after selecting, 0 dice left → hot dice
    const state = makeState({ dice: [makeDie(1, 1)], turnScore: 100 });
    const decision = getAIDecision(state, 'easy');
    expect(decision.action).toBe('select-and-roll');
    expect(decision.selectedDiceIds).toContain(1);
  });

  it('selects the correct die IDs', () => {
    // Mix: die 3 shows 1 (scoring), others show 2/4 (non-scoring)
    const dice = [makeDie(3, 1), makeDie(7, 2), makeDie(11, 4)];
    const state = makeState({ dice, turnScore: 500 });
    const decision = getAIDecision(state, 'easy');
    expect(decision.selectedDiceIds).toContain(3);
    expect(decision.selectedDiceIds).not.toContain(7);
    expect(decision.selectedDiceIds).not.toContain(11);
  });
});

// ─── Medium strategy ─────────────────────────────────────────────────────────

describe('medium strategy', () => {
  it('banks when accumulated score reaches 600', () => {
    // Die showing 1 (100 pts) + turnScore 500 → totalIfBanked = 600
    const state = makeState({ dice: [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3)], turnScore: 500 });
    const decision = getAIDecision(state, 'medium');
    expect(decision.action).toBe('select-and-bank');
  });

  it('rolls when below 600 threshold with plenty of dice left', () => {
    // totalIfBanked = 100, 4 dice remaining → roll
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3), makeDie(4, 4), makeDie(5, 6)];
    const state = makeState({ dice, turnScore: 0 });
    const decision = getAIDecision(state, 'medium');
    expect(decision.action).toBe('select-and-roll');
  });

  it('raises threshold to 1000 when opponent is near win (≥80% of target)', () => {
    // Opponent (player index 1) has 8000/10000 → urgency = true → threshold = 1000
    // totalIfBanked = 700 (< 1000) and 4 non-scoring dice remain (> 2) → roll
    const players = [makePlayer(0, false), makePlayer(8000, true)];
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3), makeDie(4, 4), makeDie(5, 6)];
    const state = makeState({ dice, players, turnScore: 600, currentPlayerIndex: 0 });
    const decision = getAIDecision(state, 'medium');
    expect(decision.action).toBe('select-and-roll');
  });

  it('banks at 1000 under opponent urgency', () => {
    const players = [makePlayer(0, false), makePlayer(8500, true)];
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3)];
    // totalIfBanked = 900 + 100 = 1000 → banks
    const state = makeState({ dice, players, turnScore: 900, currentPlayerIndex: 0 });
    const decision = getAIDecision(state, 'medium');
    expect(decision.action).toBe('select-and-bank');
  });

  it('banks when ≤ 2 dice remain', () => {
    const dice = [makeDie(1, 5), makeDie(2, 3)];
    const state = makeState({ dice, turnScore: 0 });
    const decision = getAIDecision(state, 'medium');
    // diceLeftAfterLock = 1 → bank
    expect(decision.action).toBe('select-and-bank');
  });
});

// ─── Hard strategy ────────────────────────────────────────────────────────────

describe('hard strategy', () => {
  it('always rolls on hot dice (0 dice remaining)', () => {
    // Single die showing 1 → locks it → 0 remaining → select-and-roll
    const state = makeState({ dice: [makeDie(1, 1)], turnScore: 200 });
    const decision = getAIDecision(state, 'hard');
    expect(decision.action).toBe('select-and-roll');
  });

  it('banks unconditionally when accumulated ≥ 1500', () => {
    // 5 dice; 1 scoring die (1) + turnScore 1400 → totalIfBanked = 1500
    const dice = [makeDie(1, 1), makeDie(2, 2), makeDie(3, 3), makeDie(4, 4), makeDie(5, 6)];
    const state = makeState({ dice, turnScore: 1400 });
    const decision = getAIDecision(state, 'hard');
    expect(decision.action).toBe('select-and-bank');
  });

  it('banks when EV is below current banked total (bad roll odds)', () => {
    // 1 remaining die after locking: pFarkle=0.667, expectedGain=50
    // At turnScore=200: totalIfBanked=300
    // ev = (0.333)*(300+50) - (0.667)*300 = 116.55 - 200.1 = -83.55 → ev < 300 → bank
    const dice = [makeDie(1, 1), makeDie(2, 6)];
    const state = makeState({ dice, turnScore: 200 });
    const decision = getAIDecision(state, 'hard');
    expect(decision.action).toBe('select-and-bank');
  });

  it('rolls when EV exceeds banked total (good roll odds with many dice)', () => {
    // 5 remaining dice after locking 1: pFarkle=0.077, expectedGain=380
    // At turnScore=0: totalIfBanked=50
    // ev = (0.923)*(50+380) - (0.077)*50 = 396.89 - 3.85 = 393.04 → ev > 50 → roll
    const dice = [
      makeDie(1, 5),
      makeDie(2, 2),
      makeDie(3, 3),
      makeDie(4, 4),
      makeDie(5, 6),
      makeDie(6, 2),
    ];
    const state = makeState({ dice, turnScore: 0 });
    const decision = getAIDecision(state, 'hard');
    expect(decision.action).toBe('select-and-roll');
  });
});

// ─── getAIDecision dispatcher ────────────────────────────────────────────────

describe('getAIDecision', () => {
  it('returns a decision with selectedDiceIds array for each difficulty', () => {
    const state = makeState({ dice: [makeDie(1, 1), makeDie(2, 5), makeDie(3, 2)], turnScore: 0 });
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const d = getAIDecision(state, difficulty);
      expect(d).toHaveProperty('action');
      expect(d).toHaveProperty('selectedDiceIds');
      expect(Array.isArray(d.selectedDiceIds)).toBe(true);
    }
  });

  it('never selects locked dice', () => {
    const dice = [
      makeDie(1, 1, true),  // locked — should not be selected
      makeDie(2, 1),        // unlocked scoring die
      makeDie(3, 3),
    ];
    const state = makeState({ dice, turnScore: 0 });
    const d = getAIDecision(state, 'easy');
    expect(d.selectedDiceIds).not.toContain(1);
    expect(d.selectedDiceIds).toContain(2);
  });
});
