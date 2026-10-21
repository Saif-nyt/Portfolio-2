"use client";

import { useCallback, useSyncExternalStore } from "react";

export type RenderQuality = "high" | "low";
export type WorldEntry = "outside" | "entering" | "inside";

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
  /** Whether the visitor has crossed the Home world gate. */
  worldEntry: WorldEntry;
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
  /** Free-walk mode is active in the Home world. */
  walkMode: boolean;
  /** Soft proximity label while walking (campfire, landmark…). */
  nearby: string | null;
  /**
   * Codex to open only after arriving at `href`. Used by cross-world actions
   * such as Forge "Discuss" → Contact, where opening immediately would be
   * closed by the route transition.
   */
  pendingCodex: { section: CodexSection; href: string } | null;
}

let state: WorldState = {
  worldEntry: "outside",
  activeObject: null,
  mapOpen: false,
  codex: null,
  collectionOpen: false,
  quality: "high",
  walkMode: false,
  nearby: null,
  pendingCodex: null,
};

// Detect the tier once when the client module loads, before the first scene is
// mounted, so a weak device never renders one high-quality frame first (and
// never overwrites a later governor drop back to high).
if (typeof window !== "undefined") {
  const detected = detectQuality();
  if (detected !== state.quality) state = { ...state, quality: detected };
}

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
  worldEntry: "outside",
  activeObject: null,
  mapOpen: false,
  codex: null,
  collectionOpen: false,
  quality: "high",
  walkMode: false,
  nearby: null,
  pendingCodex: null,
};

function getServerSnapshot(): WorldState {
  return SERVER_STATE;
}

/** Imperative actions — callable from3D callbacks without React state plumbing. */
export const worldActions = {
  beginWorldEntry() {
    if (state.worldEntry !== "outside") return;
    state = { ...state, worldEntry: "entering" };
    emit();
  },
  completeWorldEntry() {
    if (state.worldEntry === "inside") return;
    state = { ...state, worldEntry: "inside" };
    emit();
  },
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
  /** Arm a codex for the next route, without flashing it on the current one. */
  queueCodex(section: CodexSection, href: string) {
    state = { ...state, pendingCodex: { section, href } };
    emit();
  },
  /**
   * Called by the destination shell once its pathname matches. Returns true if
   * a queued codex was opened.
   */
  consumeQueuedCodex(pathname: string): boolean {
    const pending = state.pendingCodex;
    if (!pending || pending.href !== pathname) return false;
    state = {
      ...state,
      pendingCodex: null,
      codex: pending.section,
      activeObject: null,
      mapOpen: false,
      collectionOpen: false,
    };
    emit();
    return true;
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
  /** Toggle free walking. Entering it dismisses any open overlay. */
  setWalkMode(active: boolean) {
    if (state.walkMode === active) return;
    state = active
      ? {
          ...state,
          walkMode: true,
          nearby: null,
          activeObject: null,
          mapOpen: false,
          codex: null,
          collectionOpen: false,
        }
      : { ...state, walkMode: false, nearby: null };
    emit();
  },
  /** Cheap, change-only status line for subtle proximity cues. */
  setNearby(label: string | null) {
    if (state.nearby === label) return;
    state = { ...state, nearby: label };
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

/** Dedicated virtual-joystick vector for walking; independent of orbit drag. */
const walkInput: MoveInput = { x: 0, y: 0 };

export function setWalkInput(x: number, y: number): void {
  walkInput.x = x;
  walkInput.y = y;
}

export function getWalkInput(): Readonly<MoveInput> {
  return walkInput;
}

export function resetWalkInput(): void {
  walkInput.x = 0;
  walkInput.y = 0;
}

/**
 * Accumulated pointer-look delta for walk mode. The render loop consumes and
 * clears it every frame, so fast mouse movement is never dropped between
 * frames and React never re-renders for camera input.
 */
const lookDelta = { x: 0, y: 0 };

export function addLookInput(x: number, y: number): void {
  lookDelta.x += x;
  lookDelta.y += y;
}

export function consumeLookInput(): Readonly<{ x: number; y: number }> {
  const value = { x: lookDelta.x, y: lookDelta.y };
  lookDelta.x = 0;
  lookDelta.y = 0;
  return value;
}

/**
 * Camera zoom, stored as a logarithmic offset from the authored pose so the
 * same gesture feels identical whether the shot is close or far. `0` is the
 * authored framing; positive pulls the camera in, negative pushes it out
 * (within {@link ZOOM_MIN}–{@link ZOOM_MAX}). Held outside React state so the
 * render loop can read it every frame with no re-renders.
 */
export const ZOOM_MIN = -1.2;
export const ZOOM_MAX = 1.2;
let zoom = 0;

export function addZoom(delta: number): void {
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + delta));
}

export function getZoom(): number {
  return zoom;
}

export function resetZoom(): void {
  zoom = 0;
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
