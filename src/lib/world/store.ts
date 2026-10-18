"use client";

import { useCallback, useSyncExternalStore } from "react";

export type RenderQuality = "high" | "low";

export interface ActiveObject {
  id: string;
  title: string;
  eyebrow?: string;
  body: string;
  bullets?: string[];
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    external?: boolean;
  }>;
}

interface WorldState {
  /** Currently open holographic panel, if any. */
  activeObject: ActiveObject | null;
  /** Whether the world map overlay is open. */
  mapOpen: boolean;
  /** Reduced-effort rendering tier for weaker devices. */
  quality: RenderQuality;
}

let state: WorldState = {
  activeObject: null,
  mapOpen: false,
  quality: "high",
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WorldState {
  return state;
}

// Cached so useSyncExternalStore sees a stable reference (a fresh object each
// call triggers React's "getServerSnapshot should be cached" infinite-loop guard).
const SERVER_STATE: WorldState = { activeObject: null, mapOpen: false, quality: "high" };

function getServerSnapshot(): WorldState {
  return SERVER_STATE;
}

/** Imperative actions — callable from3D callbacks without React state plumbing. */
export const worldActions = {
  openPanel(object: ActiveObject) {
    state = { ...state, activeObject: object };
    emit();
  },
  closePanel() {
    if (!state.activeObject) return;
    state = { ...state, activeObject: null };
    emit();
  },
  toggleMap(open?: boolean) {
    const next = open ?? !state.mapOpen;
    if (next === state.mapOpen) return;
    state = { ...state, mapOpen: next };
    emit();
  },
  setQuality(quality: RenderQuality) {
    if (quality === state.quality) return;
    state = { ...state, quality };
    emit();
  },
};

/** SSR-safe subscription hook for the world shell. */
export function useWorldState(): WorldState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Detect a sensible render tier once on the client. */
export function detectQuality(): RenderQuality {
  if (typeof navigator === "undefined") return "high";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return "low";
  if (typeof memory === "number" && memory <= 4) return "low";
  if (coarse && window.innerWidth < 768) return "low";
  return "high";
}

export function useClosePanel(): () => void {
  return useCallback(() => worldActions.closePanel(), []);
}
