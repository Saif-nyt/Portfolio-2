"use client";

import { useSyncExternalStore } from "react";
import { readJson, writeJson } from "@/lib/storage";
import { LOCATIONS, LOCATION_BY_ID, type LocationId } from "@/lib/world/registry";
import { unlockAchievement } from "@/lib/game";
import { playBlip } from "@/lib/sound";
import type { ArtifactRarity } from "@/lib/world/artifacts";
import { levelFromXp } from "@/lib/world/xp";

export { XP_PER_LEVEL, levelFromXp, levelProgress } from "@/lib/world/xp";

/**
 * Progression layer for the discovery game: XP + level, the set of objects the
 * explorer has discovered, the artifacts they have collected, the locations
 * they have visited, and which achievements/quests are complete. Persisted to
 * localStorage under `nebula:progress` and exposed as an external store so the
 * R3F scenes and DOM overlays can both read it without prop plumbing.
 */

/** XP awarded for first-time actions (collect rewards vary by artifact rarity). */
export const REWARD = {
  visit: 12,
  discover: 8,
} as const;

export interface ProgressState {
  xp: number;
  /** Ids of any hotspot/object inspected for the first time. */
  discoveries: string[];
  /** Ids of Vault artifacts explicitly collected. */
  collected: string[];
  visited: LocationId[];
  achievements: string[];
  quests: string[];
}

const KEY = "progress";

const EMPTY: ProgressState = {
  xp: 0,
  discoveries: [],
  collected: [],
  visited: [],
  achievements: [],
  quests: [],
};

function isLocationId(value: unknown): value is LocationId {
  return typeof value === "string" && value in LOCATION_BY_ID;
}

function sanitize(raw: unknown): ProgressState {
  const record = (raw ?? {}) as Partial<Record<keyof ProgressState, unknown>>;
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return {
    xp: typeof record.xp === "number" && Number.isFinite(record.xp) ? Math.max(0, record.xp) : 0,
    discoveries: strings(record.discoveries),
    collected: strings(record.collected),
    visited: strings(record.visited).filter(isLocationId),
    achievements: strings(record.achievements),
    quests: strings(record.quests),
  };
}

let state: ProgressState = EMPTY;
let loaded = false;

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  if (typeof window === "undefined") return;
  state = sanitize(readJson<unknown>(KEY, EMPTY));
}

function persist(): void {
  writeJson(KEY, state);
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ProgressState {
  ensureLoaded();
  return state;
}

// Cached so useSyncExternalStore sees a stable server snapshot.
const SERVER_STATE: ProgressState = EMPTY;

function getServerSnapshot(): ProgressState {
  return SERVER_STATE;
}

/* ------------------------------------------------------------------ *
 * Catalogue context — reported by the Vault once projects load, so
 * collection achievements can reference the live artifact set.
 * ------------------------------------------------------------------ */

let catalogTotal = 0;
const relicIds = new Set<string>();

export interface CatalogReport {
  total: number;
  relicIds: string[];
}

interface EvalContext {
  state: ProgressState;
  catalogTotal: number;
  relicIds: Set<string>;
  level: number;
}

interface AchievementDef {
  id: string;
  title: string;
  detail: string;
  earned: (ctx: EvalContext) => boolean;
}

interface QuestDef {
  id: string;
  title: string;
  detail: string;
  target: (ctx: EvalContext) => number;
  value: (ctx: EvalContext) => number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-contact",
    title: "First Contact",
    detail: "Inspected your first artifact",
    earned: ({ state: s }) => s.discoveries.length >= 1,
  },
  {
    id: "cartographer",
    title: "Cartographer",
    detail: "Surveyed eight objects across the nebula",
    earned: ({ state: s }) => s.discoveries.length >= 8,
  },
  {
    id: "collector",
    title: "Collector",
    detail: "Collected three artifacts",
    earned: ({ state: s }) => s.collected.length >= 3,
  },
  {
    id: "relic-hunter",
    title: "Relic Hunter",
    detail: "Recovered a relic-class artifact",
    earned: ({ state: s, relicIds: relics }) => s.collected.some((id) => relics.has(id)),
  },
  {
    id: "curator",
    title: "Curator",
    detail: "Collected every catalogued artifact",
    earned: ({ state: s, catalogTotal: total }) => total > 0 && s.collected.length >= total,
  },
  {
    id: "pathwalker",
    title: "Pathwalker",
    detail: "Set foot in four locations",
    earned: ({ state: s }) => s.visited.length >= 4,
  },
  {
    id: "pilgrim",
    title: "Pilgrim",
    detail: "Visited every location in the nebula",
    earned: ({ state: s }) => s.visited.length >= LOCATIONS.length,
  },
  {
    id: "ascendant",
    title: "Ascendant",
    detail: "Reached explorer level 3",
    earned: ({ level }) => level >= 3,
  },
];

const QUESTS: QuestDef[] = [
  {
    id: "chart-nebula",
    title: "Chart the Nebula",
    detail: "Travel to five locations",
    target: () => 5,
    value: ({ state: s }) => s.visited.length,
  },
  {
    id: "stock-vault",
    title: "Stock the Vault",
    detail: "Collect four artifacts",
    target: () => 4,
    value: ({ state: s }) => s.collected.length,
  },
  {
    id: "survey",
    title: "Cartographer's Survey",
    detail: "Inspect eight objects",
    target: () => 8,
    value: ({ state: s }) => s.discoveries.length,
  },
];

export function achievementList(): AchievementDef[] {
  return ACHIEVEMENTS;
}

export function questList(): QuestDef[] {
  return QUESTS;
}

export interface QuestView {
  id: string;
  title: string;
  detail: string;
  value: number;
  target: number;
  done: boolean;
}

/** Resolved quest views (progress + completion) for the collection overlay. */
export function questViews(snapshot: ProgressState, report?: CatalogReport): QuestView[] {
  const ctx: EvalContext = {
    state: snapshot,
    catalogTotal: report?.total ?? catalogTotal,
    relicIds: report ? new Set(report.relicIds) : relicIds,
    level: levelFromXp(snapshot.xp),
  };
  return QUESTS.map((quest) => {
    const target = Math.max(1, quest.target(ctx));
    const value = quest.value(ctx);
    return {
      id: quest.id,
      title: quest.title,
      detail: quest.detail,
      value: Math.min(value, target),
      target,
      done: value >= target || snapshot.quests.includes(quest.id),
    };
  });
}

/**
 * Re-test every achievement and quest against the current state. Newly met
 * conditions award XP-free recognition (the toast + list) exactly once.
 */
function evaluate(): boolean {
  const ctx: EvalContext = {
    state,
    catalogTotal,
    relicIds,
    level: levelFromXp(state.xp),
  };
  const nextAchievements = new Set(state.achievements);
  const nextQuests = new Set(state.quests);
  let changed = false;

  for (const achievement of ACHIEVEMENTS) {
    if (nextAchievements.has(achievement.id)) continue;
    if (achievement.earned(ctx)) {
      nextAchievements.add(achievement.id);
      unlockAchievement({ id: achievement.id, title: achievement.title, detail: achievement.detail });
      changed = true;
    }
  }

  for (const quest of QUESTS) {
    if (nextQuests.has(quest.id)) continue;
    if (quest.value(ctx) >= quest.target(ctx)) {
      nextQuests.add(quest.id);
      unlockAchievement({ id: `quest-${quest.id}`, title: quest.title, detail: "Quest complete" });
      changed = true;
    }
  }

  if (changed) {
    state = {
      ...state,
      achievements: [...nextAchievements],
      quests: [...nextQuests],
    };
  }
  return changed;
}

function commit(): void {
  // Evaluate first (may add achievement/quest ids), then persist + notify.
  evaluate();
  persist();
  emit();
}

/** Imperative actions — callable from 3D callbacks and DOM handlers alike. */
export const progressActions = {
  /** Record a location visit; first-time visits award XP. */
  visitLocation(id: LocationId): void {
    ensureLoaded();
    if (state.visited.includes(id)) return;
    state = { ...state, visited: [...state.visited, id], xp: state.xp + REWARD.visit };
    commit();
  },

  /** Record the first inspection of any object; awards XP once. */
  discover(id: string, xp: number = REWARD.discover): void {
    ensureLoaded();
    if (!id || state.discoveries.includes(id)) return;
    state = { ...state, discoveries: [...state.discoveries, id], xp: state.xp + xp };
    commit();
  },

  /**
   * Collect a Vault artifact. Only valid once discovered; awards the rarity's
   * XP once and marks the artifact owned.
   */
  collect(id: string, rarity: ArtifactRarity): boolean {
    ensureLoaded();
    if (!id || state.collected.includes(id)) return false;
    if (!state.discoveries.includes(id)) return false;
    const xp = rarity === "relic" ? 90 : rarity === "artifact" ? 45 : 20;
    state = { ...state, collected: [...state.collected, id], xp: state.xp + xp };
    playBlip();
    commit();
    return true;
  },

  /** Report the live artifact catalogue so collection goals can resolve. */
  reportCatalog(report: CatalogReport): void {
    catalogTotal = Math.max(0, report.total);
    relicIds.clear();
    for (const id of report.relicIds) relicIds.add(id);
    if (evaluate()) {
      persist();
      emit();
    }
  },

  /** Wipe all progress (keeps sound preference and achievement toast history). */
  reset(): void {
    ensureLoaded();
    state = EMPTY;
    persist();
    emit();
  },
};

/** SSR-safe subscription hook for progression UI. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
