import type { Die, DieValue } from '../types/game';
import { NUM_DICE } from './constants';

export function randomDieValue(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue;
}

export function createDice(): Die[] {
  return Array.from({ length: NUM_DICE }, (_, i) => ({
    id: i,
    value: randomDieValue(),
    isSelected: false,
    isLocked: false,
    isRolling: false,
  }));
}

/**
 * Roll all non-locked dice and return updated dice array.
 * Sets isRolling=true for rolled dice (animation cleared after delay).
 */
export function rollDice(dice: Die[]): Die[] {
  return dice.map((die) => {
    if (die.isLocked) return die;
    return {
      ...die,
      value: randomDieValue(),
      isSelected: false,
      isRolling: true,
    };
  });
}

/** After animation completes, clear rolling state */
export function clearRolling(dice: Die[]): Die[] {
  return dice.map((d) => ({ ...d, isRolling: false }));
}

/** Lock selected dice (they count for this turn), unselect them */
export function lockSelectedDice(dice: Die[]): Die[] {
  return dice.map((d) =>
    d.isSelected ? { ...d, isLocked: true, isSelected: false } : d
  );
}

/** Reset all dice (for hot dice or new turn) */
export function resetAllDice(): Die[] {
  return Array.from({ length: NUM_DICE }, (_, i) => ({
    id: i,
    value: randomDieValue(),
    isSelected: false,
    isLocked: false,
    isRolling: true,
  }));
}

/** Number of dice available to roll (not locked) */
export function availableDiceCount(dice: Die[]): number {
  return dice.filter((d) => !d.isLocked).length;
}
