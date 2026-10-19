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

/** Deep-dive codex overlays — open in-world instead of ejecting to quick mode. */
export type CodexSection = "about" | "skills" | "services" | "work" | "insights" | "contact";

interface WorldState {
  /** Currently open holographic panel, if any. */
  activeObject: ActiveObject | null;
  /** Whether the world map overlay is open. */
  mapOpen: boolean;
  /** Currently open codex overlay (deep content: story, skills, projects…), if any. */
  codex: CodexSection | null;
  /** Whether the explorer's collection/progression overlay is open. */
  collectionOpen: boolean;
  /** Reduced-effort rendering tier for weaker devices. */
  quality: RenderQuality;
}

let state: WorldState = {
  activeObject: null,
  mapOpen: false,
  codex: null,
  collectionOpen: false,
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
const SERVER_STATE: WorldState = {
  activeObject: null,
  mapOpen: false,
  codex: null,
  collectionOpen: false,
  quality: "high",
};

function getServerSnapshot(): WorldState {
  return SERVER_STATE;
}

/** Imperative actions — callable from3D callbacks without React state plumbing. */
export const worldActions = {
  openPanel(object: ActiveObject) {
    state = { ...state, activeObject: object, mapOpen: false, codex: null, collectionOpen: false };
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
    // Map replaces whatever else is open so only one overlay shows at a time.
    state = {
      ...state,
      mapOpen: next,
      activeObject: next ? null : state.activeObject,
      codex: next ? null : state.codex,
      collectionOpen: next ? false : state.collectionOpen,
    };
    emit();
  },
  openCodex(section: CodexSection) {
    if (section === state.codex) return;
    state = { ...state, codex: section, activeObject: null, mapOpen: false, collectionOpen: false };
    emit();
  },
  closeCodex() {
    if (!state.codex) return;
    state = { ...state, codex: null };
    emit();
  },
  toggleCollection(open?: boolean) {
    const next = open ?? !state.collectionOpen;
    if (next === state.collectionOpen) return;
    // Collection replaces other overlays so only one is ever on screen.
    state = {
      ...state,
      collectionOpen: next,
      activeObject: next ? null : state.activeObject,
      mapOpen: next ? false : state.mapOpen,
      codex: next ? null : state.codex,
    };
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

/**
 * Full-screen drag navigation ("invisible joystick"). Held as a mutable
 * module value rather than React state so the R3F render loop can sample it
 * every frame with zero re-renders — the same reason the world state above is
 * an external store. `x`/`y` are normalised to [-1, 1].
 */
export interface MoveInput {
  /** -1 left … 1 right */
  x: number;
  /** -1 back … 1 forward */
  y: number;
}

const moveInput: MoveInput = { x: 0, y: 0 };

export function setMoveInput(x: number, y: number): void {
  moveInput.x = x;
  moveInput.y = y;
}

export function getMoveInput(): Readonly<MoveInput> {
  return moveInput;
}

/** Snap the virtual joystick back to rest (finger up, blur, cancel, …). */
export function resetMoveInput(): void {
  moveInput.x = 0;
  moveInput.y = 0;
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
