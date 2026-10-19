"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Single source of truth for the visitor's theme.
 *
 * The document's `data-theme` attribute is authoritative (an inline script in
 * the root layout sets it before first paint), so every consumer — DOM and the
 * WebGL world alike — reads from one place and stays in sync through a custom
 * event. Preference is persisted to localStorage under `theme` (the same key
 * the bootstrap script reads) and falls back to the system preference.
 */

export type Theme = "dark" | "light";

export const THEME_EVENT = "pandora:theme-change";
export const THEME_STORAGE_KEY = "theme";

export function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** The visitor's preference, or null when they have never chosen explicitly. */
export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

/** Whichever theme should apply when there is no saved preference. */
export function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Apply a theme to the document, optionally persisting it as a preference. */
export function applyTheme(next: Theme, persist = true): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = next;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked — the theme still applies for this session.
    }
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

function subscribe(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** SSR-safe theme hook (server snapshot is always the dark default). */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Switch theme with a soft palette cross-fade where the browser supports the
 * View Transitions API. Skipped under reduced motion; the preference is always
 * written so the choice survives navigation and reloads.
 */
export function setTheme(next: Theme): void {
  const persist = () => applyTheme(next, true);

  if (typeof document === "undefined") return;
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(persist);
  } else {
    persist();
  }
}

export function toggleTheme(): Theme {
  const next = readTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/** Boolean convenience for consumers that only branch on light vs dark. */
export function useIsLight(): boolean {
  return useTheme() === "light";
}

/** Stable callback wrapper for the toggle button. */
export function useThemeToggle(): () => void {
  return useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  }, []);
}
