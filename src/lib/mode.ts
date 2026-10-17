"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readJson, writeJson } from "@/lib/storage";

export type GameMode = "immersive" | "quick";

export const MODE_CHANGE_EVENT = "nebula:mode-change";
const MODE_KEY = "mode";

/** Sync read of the stored mode; null means "no choice made yet". */
export function readStoredMode(): GameMode | null {
  const value = readJson<GameMode | null>(MODE_KEY, null);
  return value === "immersive" || value === "quick" ? value : null;
}

/** Persist the visitor's mode choice and broadcast the change. */
export function setStoredMode(mode: GameMode): void {
  writeJson(MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent(MODE_CHANGE_EVENT));
}

function subscribe(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === `nebula:${MODE_KEY}` || event.key === null) callback();
  };
  window.addEventListener(MODE_CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(MODE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** SSR-safe mode hook (server snapshot is always null). */
export function useGameMode(): [GameMode | null, (mode: GameMode) => void] {
  const mode = useSyncExternalStore(subscribe, readStoredMode, () => null);
  const setMode = useCallback((next: GameMode) => setStoredMode(next), []);
  return [mode, setMode];
}
