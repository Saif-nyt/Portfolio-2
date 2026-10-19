/**
 * Pure XP/level maths for the progression system. Kept free of React and DOM
 * imports so it can be unit-tested directly and reasoned about on its own.
 */

export const XP_PER_LEVEL = 150;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

/** Fraction of the current level filled, 0–1. */
export function levelProgress(xp: number): number {
  return (Math.max(0, xp) % XP_PER_LEVEL) / XP_PER_LEVEL;
}
