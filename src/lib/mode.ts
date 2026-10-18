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

/**
 * Reveal the real (non-3D) page content and scroll an in-page anchor into
 * view. Explore mode unmounts the fallback DOM that owns ids like `#form`,
 * so any hotspot that targets an anchor must flip to quick mode first, then
 * scroll once React has mounted the content.
 *
 * The mount happens on a later frame than the mode broadcast, so the scroll
 * is retried on animation frames for up to a second instead of firing once
 * against an element that does not exist yet.
 */
export function revealAnchor(id: string): void {
  setStoredMode("quick");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();

  const attempt = () => {
    const target = document.getElementById(id);
    if (target) {
      // Move keyboard focus with the viewport so the section is both seen
      // and reachable without another Tab press.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      return;
    }
    if (performance.now() - start < 1200) requestAnimationFrame(attempt);
  };

  requestAnimationFrame(attempt);
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
