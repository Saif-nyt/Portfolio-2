"use client";

import { useSyncExternalStore } from "react";
import { MISSIONS } from "@/data/missions";
import { unlockAchievement } from "@/lib/game";
import { readJson, writeJson } from "@/lib/storage";

export interface MissionProgress {
  completed: string[];
  discovered: string[];
}

export const PROGRESS_EVENT = "nebula:progress-change";

const EMPTY_PROGRESS: MissionProgress = { completed: [], discovered: [] };

/**
 * useSyncExternalStore requires getSnapshot to return the same reference while
 * the underlying data is unchanged. localStorage is re-parsed on every read, so
 * the result is memoized against a signature of the two id lists.
 */
let cacheSignature: string | null = null;
let cacheValue: MissionProgress = EMPTY_PROGRESS;

export function readProgress(): MissionProgress {
  const raw = readJson<Partial<MissionProgress>>("progress", EMPTY_PROGRESS);
  const completed = Array.isArray(raw.completed) ? raw.completed : [];
  const discovered = Array.isArray(raw.discovered) ? raw.discovered : [];
  const signature = JSON.stringify([completed, discovered]);
  if (signature !== cacheSignature) {
    cacheSignature = signature;
    cacheValue = { completed, discovered };
  }
  return cacheValue;
}

function emit(): void {
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

/** Mark a mission complete (idempotent) and announce it. */
export function completeMission(id: string): void {
  const progress = readProgress();
  if (progress.completed.includes(id)) return;
  const completed = [...progress.completed, id];
  writeJson("progress", { ...progress, completed });
  emit();

  const mission = MISSIONS.find((entry) => entry.id === id);
  if (mission) {
    unlockAchievement({
      id: `mission-${mission.id}`,
      title: `Mission ${mission.number} complete`,
      detail: mission.title,
    });
  }
  if (completed.length >= MISSIONS.length) {
    unlockAchievement({
      id: "network-restored",
      title: "Network restored",
      detail: "All six zones are back online.",
    });
  }
}

/** Record a visited zone (cosmetic survey state; never blocks content). */
export function discoverZone(zoneId: string): void {
  const progress = readProgress();
  if (progress.discovered.includes(zoneId)) return;
  writeJson("progress", { ...progress, discovered: [...progress.discovered, zoneId] });
  emit();
}

/** Clear all game progress (missions + discoveries). */
export function resetProgress(): void {
  writeJson("progress", EMPTY_PROGRESS);
  emit();
}

/** Mission complete/active lookup for a zone id. */
export function missionForZone(zoneId: string): string | null {
  return MISSIONS.find((mission) => mission.zoneId === zoneId)?.id ?? null;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** SSR-safe mission progress hook. */
export function useMissionProgress(): MissionProgress {
  return useSyncExternalStore(subscribe, readProgress, () => EMPTY_PROGRESS);
}
