export const ACHIEVEMENT_EVENT = "pandora:achievement";

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
