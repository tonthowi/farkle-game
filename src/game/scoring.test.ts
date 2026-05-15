import { describe, it, expect } from 'vitest';
import type { Die, DieValue } from '../types/game';
import {
  calculateScore,
  hasScoringDice,
  isValidSelection,
  selectionScore,
  getBestScoringSubset,
} from './scoring';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeDie(id: number, value: DieValue, opts: Partial<Die> = {}): Die {
  return { id, value, isSelected: false, isLocked: false, isRolling: false, ...opts };
}

/** Sort so order doesn't matter when comparing getBestScoringSubset results */
function sorted(values: DieValue[]): DieValue[] {
  return [...values].sort((a, b) => a - b);
}

// ─── calculateScore ─────────────────────────────────────────────────────────

describe('calculateScore', () => {
  it('returns zero score for empty array', () => {
    expect(calculateScore([])).toEqual({ score: 0, label: '' });
  });

  // Singles
  it('scores a single 1 as 100', () => {
    expect(calculateScore([1]).score).toBe(100);
  });

  it('scores a single 5 as 50', () => {
    expect(calculateScore([5]).score).toBe(50);
  });

  it('scores two 1s as 200', () => {
    expect(calculateScore([1, 1]).score).toBe(200);
  });

  it('scores two 5s as 100', () => {
    expect(calculateScore([5, 5]).score).toBe(100);
  });

  it('non-scoring singles (2, 3, 4, 6) give 0', () => {
    expect(calculateScore([2]).score).toBe(0);
    expect(calculateScore([3]).score).toBe(0);
    expect(calculateScore([4]).score).toBe(0);
    expect(calculateScore([6]).score).toBe(0);
  });

  // Triples
  it('three 1s → 1000', () => {
    expect(calculateScore([1, 1, 1]).score).toBe(1000);
  });

  it('three 2s → 200', () => {
    expect(calculateScore([2, 2, 2]).score).toBe(200);
  });

  it('three 3s → 300', () => {
    expect(calculateScore([3, 3, 3]).score).toBe(300);
  });

  it('three 4s → 400', () => {
    expect(calculateScore([4, 4, 4]).score).toBe(400);
  });

  it('three 5s → 500', () => {
    expect(calculateScore([5, 5, 5]).score).toBe(500);
  });

  it('three 6s → 600', () => {
    expect(calculateScore([6, 6, 6]).score).toBe(600);
  });

  // Multiples beyond triple (2×, 4×, 8× the triple base)
  it('four 2s → 400 (baseTriple × 2)', () => {
    expect(calculateScore([2, 2, 2, 2]).score).toBe(400);
  });

  it('five 3s → 1200 (300 × 4)', () => {
    expect(calculateScore([3, 3, 3, 3, 3]).score).toBe(1200);
  });

  it('six 4s → 3200 (400 × 8)', () => {
    expect(calculateScore([4, 4, 4, 4, 4, 4]).score).toBe(3200);
  });

  it('four 1s → 2000 (1000 × 2)', () => {
    expect(calculateScore([1, 1, 1, 1]).score).toBe(2000);
  });

  it('five 1s → 4000 (1000 × 4)', () => {
    expect(calculateScore([1, 1, 1, 1, 1]).score).toBe(4000);
  });

  it('six 1s → 8000 (1000 × 8)', () => {
    expect(calculateScore([1, 1, 1, 1, 1, 1]).score).toBe(8000);
  });

  // Six-dice special combos
  it('straight [1,2,3,4,5,6] → 1500', () => {
    expect(calculateScore([1, 2, 3, 4, 5, 6]).score).toBe(1500);
    expect(calculateScore([1, 2, 3, 4, 5, 6]).label).toBe('Straight!');
  });

  it('three pairs → 750', () => {
    expect(calculateScore([1, 1, 2, 2, 3, 3]).score).toBe(750);
    expect(calculateScore([1, 1, 2, 2, 3, 3]).label).toBe('Three Pairs!');
  });

  it('two triplets → 2500', () => {
    expect(calculateScore([1, 1, 1, 2, 2, 2]).score).toBe(2500);
    expect(calculateScore([1, 1, 1, 2, 2, 2]).label).toBe('Two Triplets!');
  });

  // Mixed hands
  it('mixed: two 1s + triple 2s + one 5 → 450', () => {
    expect(calculateScore([1, 1, 5, 2, 2, 2]).score).toBe(450);
  });

  it('mixed: triple 6s + one 1 → 700', () => {
    expect(calculateScore([6, 6, 6, 1]).score).toBe(700);
  });
});

// ─── hasScoringDice ──────────────────────────────────────────────────────────

describe('hasScoringDice', () => {
  it('single 1 → true', () => {
    expect(hasScoringDice([1])).toBe(true);
  });

  it('single 5 → true', () => {
    expect(hasScoringDice([5])).toBe(true);
  });

  it('[2,3,4,6] → false (Farkle)', () => {
    expect(hasScoringDice([2, 3, 4, 6])).toBe(false);
  });

  it('triple of non-1/5 → true', () => {
    expect(hasScoringDice([2, 2, 2])).toBe(true);
    expect(hasScoringDice([6, 6, 6])).toBe(true);
  });

  it('two pairs, no 1/5, no triple → false', () => {
    expect(hasScoringDice([2, 2, 3, 3, 4, 6])).toBe(false);
  });

  it('six-dice straight → true', () => {
    expect(hasScoringDice([1, 2, 3, 4, 5, 6])).toBe(true);
  });

  it('six-dice three pairs → true', () => {
    expect(hasScoringDice([2, 2, 3, 3, 4, 4])).toBe(true);
  });

  it('six-dice two triplets → true', () => {
    expect(hasScoringDice([2, 2, 2, 3, 3, 3])).toBe(true);
  });
});

// ─── isValidSelection ────────────────────────────────────────────────────────

describe('isValidSelection', () => {
  it('empty selection → false', () => {
    expect(isValidSelection([])).toBe(false);
  });

  it('selected die showing 1 → true', () => {
    const die = makeDie(1, 1, { isSelected: true });
    expect(isValidSelection([die])).toBe(true);
  });

  it('selected die showing 2 → false', () => {
    const die = makeDie(1, 2, { isSelected: true });
    expect(isValidSelection([die])).toBe(false);
  });

  it('selected triple → true', () => {
    const dice = [makeDie(1, 3), makeDie(2, 3), makeDie(3, 3)];
    expect(isValidSelection(dice)).toBe(true);
  });
});

// ─── selectionScore ──────────────────────────────────────────────────────────

describe('selectionScore', () => {
  it('no selected dice → 0', () => {
    const dice = [makeDie(1, 2), makeDie(2, 3)];
    expect(selectionScore(dice)).toBe(0);
  });

  it('selected 1 and 5 → 150', () => {
    const dice = [
      makeDie(1, 1, { isSelected: true }),
      makeDie(2, 5, { isSelected: true }),
      makeDie(3, 2),
    ];
    expect(selectionScore(dice)).toBe(150);
  });

  it('selected triple of 4s → 400', () => {
    const dice = [
      makeDie(1, 4, { isSelected: true }),
      makeDie(2, 4, { isSelected: true }),
      makeDie(3, 4, { isSelected: true }),
    ];
    expect(selectionScore(dice)).toBe(400);
  });
});

// ─── getBestScoringSubset (C-05 edge cases) ──────────────────────────────────

describe('getBestScoringSubset', () => {
  it('empty input → []', () => {
    expect(getBestScoringSubset([])).toEqual([]);
  });

  it('single 1 → [1]', () => {
    expect(sorted(getBestScoringSubset([1]))).toEqual([1]);
  });

  it('single 5 → [5]', () => {
    expect(sorted(getBestScoringSubset([5]))).toEqual([5]);
  });

  it('single non-scoring die → []', () => {
    expect(getBestScoringSubset([2])).toEqual([]);
    expect(getBestScoringSubset([3])).toEqual([]);
    expect(getBestScoringSubset([4])).toEqual([]);
    expect(getBestScoringSubset([6])).toEqual([]);
  });

  it('non-scoring group → []', () => {
    expect(getBestScoringSubset([3, 4, 6])).toEqual([]);
  });

  it('1 and 5 together → both returned', () => {
    expect(sorted(getBestScoringSubset([1, 5]))).toEqual([1, 5]);
  });

  it('triple of 2s → all three returned', () => {
    expect(sorted(getBestScoringSubset([2, 2, 2]))).toEqual([2, 2, 2]);
  });

  it('triple of 3s → all three returned', () => {
    expect(sorted(getBestScoringSubset([3, 3, 3]))).toEqual([3, 3, 3]);
  });

  it('1 + triple of 2s → all four returned', () => {
    expect(sorted(getBestScoringSubset([1, 2, 2, 2]))).toEqual([1, 2, 2, 2]);
  });

  it('5 + triple of 3s → all four returned', () => {
    expect(sorted(getBestScoringSubset([5, 3, 3, 3]))).toEqual([3, 3, 3, 5]);
  });

  it('mixed singles + non-scoring pair: only 1 and 5 returned', () => {
    expect(sorted(getBestScoringSubset([1, 5, 2, 3]))).toEqual([1, 5]);
  });

  it('six-dice straight → all 6 dice returned', () => {
    const result = sorted(getBestScoringSubset([1, 2, 3, 4, 5, 6]));
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('six-dice three pairs → all 6 dice returned', () => {
    const result = sorted(getBestScoringSubset([1, 1, 2, 2, 3, 3]));
    expect(result).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('six-dice two triplets → all 6 dice returned', () => {
    const result = sorted(getBestScoringSubset([1, 1, 1, 2, 2, 2]));
    expect(result).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it('four-of-a-kind → all four returned', () => {
    expect(sorted(getBestScoringSubset([1, 1, 1, 1]))).toEqual([1, 1, 1, 1]);
    expect(sorted(getBestScoringSubset([4, 4, 4, 4]))).toEqual([4, 4, 4, 4]);
  });

  it('five-of-a-kind → all five returned', () => {
    expect(sorted(getBestScoringSubset([5, 5, 5, 5, 5]))).toEqual([5, 5, 5, 5, 5]);
  });

  it('six-of-a-kind non-special combo → all six returned', () => {
    expect(sorted(getBestScoringSubset([2, 2, 2, 2, 2, 2]))).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('two scoring singles among non-scoring dice → only singles returned', () => {
    expect(sorted(getBestScoringSubset([1, 1, 5, 5, 2, 3]))).toEqual([1, 1, 5, 5]);
  });

  it('triple 1s + triple 5s in six dice → detected as two triplets, all 6 returned', () => {
    // [1,1,1,5,5,5] — two triplets full-set check fires first
    const result = sorted(getBestScoringSubset([1, 1, 1, 5, 5, 5]));
    expect(result).toEqual([1, 1, 1, 5, 5, 5]);
  });
});
