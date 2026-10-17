export const ACHIEVEMENT_EVENT = "pandora:achievement";
export const WORLD_EXIT_EVENT = "nebula:world-exit";
export const WORLD_ENTER_EVENT = "nebula:world-enter";

export interface Achievement {
  id: string;
  title: string;
  detail: string;
}

/** Fire a game-style achievement (deduped + announced by AchievementToast). */
export function unlockAchievement(achievement: Achievement) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Achievement>(ACHIEVEMENT_EVENT, { detail: achievement }));
}

/** Ask the game overlay to close the world and reveal the site beneath. */
export function exitWorld() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WORLD_EXIT_EVENT));
}

/** Ask the game overlay to open the world (from any route). */
export function enterWorld() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WORLD_ENTER_EVENT));
}
