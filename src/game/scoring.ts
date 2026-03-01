import type { Die, DieValue, ScoreResult } from '../types/game';

/**
 * Calculate the score for a given array of die values.
 * Uses greedy highest-value interpretation.
 */
export function calculateScore(values: DieValue[]): ScoreResult {
  if (values.length === 0) return { score: 0, label: '' };

  const counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
  for (const v of values) counts[v]++;

  // Check special full-set combinations (only valid when exactly 6 dice)
  if (values.length === 6) {
    // Straight 1-2-3-4-5-6
    if (counts.slice(1).every((c) => c === 1)) {
      return { score: 1500, label: 'Straight!' };
    }
    // Three Pairs
    const pairs = counts.slice(1).filter((c) => c === 2).length;
    if (pairs === 3) {
      return { score: 750, label: 'Three Pairs!' };
    }
    // Two Triplets
    const triplets = counts.slice(1).filter((c) => c >= 3).length;
    if (triplets === 2) {
      return { score: 2500, label: 'Two Triplets!' };
    }
  }

  // Sum up individual scoring combinations
  let total = 0;
  const labels: string[] = [];

  for (let face = 1; face <= 6; face++) {
    const count = counts[face];
    if (count === 0) continue;

    const baseTriple = face === 1 ? 1000 : face * 100;

    if (count >= 6) {
      total += baseTriple * 8;
      labels.push(`Six ${face}s`);
    } else if (count >= 5) {
      total += baseTriple * 4;
      labels.push(`Five ${face}s`);
      // handle leftover if any (shouldn't be for typical sets)
    } else if (count >= 4) {
      total += baseTriple * 2;
      labels.push(`Four ${face}s`);
    } else if (count >= 3) {
      total += baseTriple;
      labels.push(`Three ${face}s`);
    } else {
      // Singles: only 1s and 5s score
      if (face === 1) {
        total += count * 100;
        if (count > 0) labels.push(`${count}×100`);
      } else if (face === 5) {
        total += count * 50;
        if (count > 0) labels.push(`${count}×50`);
      }
    }
  }

  return { score: total, label: labels.join(' + ') };
}

/**
 * Check whether ANY dice in a freshly-rolled set can produce a score.
 * Used for Farkle detection.
 */
export function hasScoringDice(values: DieValue[]): boolean {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const v of values) counts[v]++;

  // 1s or 5s
  if (counts[1] > 0 || counts[5] > 0) return true;
  // Any triple or better
  for (let face = 2; face <= 6; face++) {
    if (counts[face] >= 3) return true;
  }
  // Special combos with 6 dice
  if (values.length === 6) {
    if (counts.slice(1).every((c) => c === 1)) return true; // straight
    if (counts.slice(1).filter((c) => c === 2).length === 3) return true; // three pairs
    if (counts.slice(1).filter((c) => c >= 3).length === 2) return true; // two triplets
  }
  return false;
}

/**
 * Check if the user's current selection scores > 0.
 * Selection must be non-empty and produce actual points.
 */
export function isValidSelection(selected: Die[]): boolean {
  if (selected.length === 0) return false;
  const values = selected.map((d) => d.value);
  return calculateScore(values).score > 0;
}

/**
 * Score of the selected subset — used for live UI feedback.
 */
export function selectionScore(dice: Die[]): number {
  const selected = dice.filter((d) => d.isSelected);
  if (selected.length === 0) return 0;
  return calculateScore(selected.map((d) => d.value)).score;
}

/**
 * Get all dice that independently score (1s and 5s, or part of a set ≥3).
 * Used by AI to find a valid automatic selection.
 */
export function getBestScoringSubset(values: DieValue[]): DieValue[] {
  const counts = new Array(7).fill(0);
  for (const v of values) counts[v]++;

  // Check full-set combos first (6 dice)
  if (values.length === 6) {
    if (counts.slice(1).every((c) => c === 1)) return values; // straight
    if (counts.slice(1).filter((c) => c === 2).length === 3) return values; // three pairs
    if (counts.slice(1).filter((c) => c >= 3).length === 2) return values; // two triplets
  }

  const result: DieValue[] = [];
  for (let face = 1; face <= 6; face++) {
    const count = counts[face];
    if (count >= 3) {
      // Take all (triple+)
      for (let i = 0; i < count; i++) result.push(face as DieValue);
    } else if (face === 1 || face === 5) {
      // Take all singles
      for (let i = 0; i < count; i++) result.push(face as DieValue);
    }
  }
  return result;
}
