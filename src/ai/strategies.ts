import type { GameState, DieValue, Difficulty } from '../types/game';
import { calculateScore, getBestScoringSubset } from '../game/scoring';

export interface AIDecision {
  action: 'select-and-bank' | 'select-and-roll';
  /** IDs of dice to select */
  selectedDiceIds: number[];
}

/**
 * Easy AI: selects all scoring dice, banks early (threshold: 300pts or ≤2 dice left).
 */
function easyStrategy(state: GameState): AIDecision {
  const unlockedDice = state.dice.filter((d) => !d.isLocked);
  const scoringValues = getBestScoringSubset(unlockedDice.map((d) => d.value));

  // Match scoring values back to dice ids (greedy: pick first matching dice)
  const selectedIds = matchValuesToDice(unlockedDice, scoringValues);
  const selectedScore = calculateScore(scoringValues).score;
  const totalIfBanked = state.turnScore + selectedScore;

  const diceLeftAfterLock = unlockedDice.length - selectedIds.length;

  // Hot dice: all dice scored — must roll again, banking is not possible here
  if (diceLeftAfterLock === 0) {
    return { action: 'select-and-roll', selectedDiceIds: selectedIds };
  }

  const shouldBank = totalIfBanked >= 300 || diceLeftAfterLock <= 2;
  return { action: shouldBank ? 'select-and-bank' : 'select-and-roll', selectedDiceIds: selectedIds };
}

/**
 * Medium AI: banks when ≥ 600 pts this turn or ≤ 2 dice left.
 */
function mediumStrategy(state: GameState): AIDecision {
  const unlockedDice = state.dice.filter((d) => !d.isLocked);
  const scoringValues = getBestScoringSubset(unlockedDice.map((d) => d.value));
  const selectedIds = matchValuesToDice(unlockedDice, scoringValues);
  const selectedScore = calculateScore(scoringValues).score;
  const totalIfBanked = state.turnScore + selectedScore;
  const diceLeftAfterLock = unlockedDice.length - selectedIds.length;

  // Risk adjustment: if opponent is close to winning, be more aggressive
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponentScore = state.players[opponentIndex]?.totalScore ?? 0;
  const urgency = opponentScore >= state.targetScore * 0.8;

  const threshold = urgency ? 1000 : 600;
  const shouldBank = totalIfBanked >= threshold || diceLeftAfterLock <= 2;

  return { action: shouldBank ? 'select-and-bank' : 'select-and-roll', selectedDiceIds: selectedIds };
}

/**
 * Hard AI: expected-value-based decision.
 * Calculates expected score from continuing vs. banking.
 */
function hardStrategy(state: GameState): AIDecision {
  const unlockedDice = state.dice.filter((d) => !d.isLocked);
  const scoringValues = getBestScoringSubset(unlockedDice.map((d) => d.value));
  const selectedIds = matchValuesToDice(unlockedDice, scoringValues);
  const selectedScore = calculateScore(scoringValues).score;
  const totalIfBanked = state.turnScore + selectedScore;
  const diceLeftAfterLock = unlockedDice.length - selectedIds.length;

  // Hot dice rule: if all are selected, rolling all 6 again is always good
  if (diceLeftAfterLock === 0) {
    return { action: 'select-and-roll', selectedDiceIds: selectedIds };
  }

  // Expected value calculation for remaining dice
  // Farkle probability table (approximate) based on number of dice
  const farkleProb: Record<number, number> = {
    1: 0.667,
    2: 0.444,
    3: 0.278,
    4: 0.160,
    5: 0.077,
    6: 0.028,
  };

  // Expected score per roll for N dice (rough empirical values)
  const expectedGain: Record<number, number> = {
    1: 50,
    2: 100,
    3: 175,
    4: 270,
    5: 380,
    6: 500,
  };

  const pFarkle = farkleProb[diceLeftAfterLock] ?? 0.3;
  const ev = (1 - pFarkle) * (totalIfBanked + expectedGain[diceLeftAfterLock]) - pFarkle * totalIfBanked;

  // Bank if ev < current total or we already have a healthy score
  const shouldBank = ev <= totalIfBanked || totalIfBanked >= 1500;
  return { action: shouldBank ? 'select-and-bank' : 'select-and-roll', selectedDiceIds: selectedIds };
}

export function getAIDecision(state: GameState, difficulty: Difficulty): AIDecision {
  switch (difficulty) {
    case 'easy': return easyStrategy(state);
    case 'medium': return mediumStrategy(state);
    case 'hard': return hardStrategy(state);
  }
}

/**
 * Match scoring die values back to concrete die IDs from the unlocked dice list.
 * Greedy: take first unlocked die with matching value for each required value.
 */
function matchValuesToDice(
  unlockedDice: { id: number; value: DieValue }[],
  scoringValues: DieValue[]
): number[] {
  const remaining = [...unlockedDice];
  const ids: number[] = [];

  for (const val of scoringValues) {
    const idx = remaining.findIndex((d) => d.value === val);
    if (idx !== -1) {
      ids.push(remaining[idx].id);
      remaining.splice(idx, 1);
    }
  }
  return ids;
}
