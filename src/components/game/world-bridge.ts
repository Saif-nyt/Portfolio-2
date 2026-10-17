import type { Zone } from "@/data/zones";

/**
 * Shared mutable state between the DOM HUD (GameWorld) and the R3F scene.
 * A module-level singleton: mutated frame-by-frame from useFrame and event
 * handlers, never stored in React state, so the React Compiler render path
 * stays pure (module mutation is not a prop/hook-argument mutation).
 */

/** Pixels (existing zone data) → world units (1 unit = 100 px). */
export const WORLD_SCALE = 0.01;
export const zoneToWorldX = (px: number) => px * WORLD_SCALE;

export const PLAYER_SPEED_U = 3.8;
export const INTERACT_RANGE_U = 1.6;
export const PATH_HALF_WIDTH = 4.2;
export const WORLD_LENGTH_U = 56;
export const SPAWN_WORLD = { x: zoneToWorldX(380), z: 0 };

export interface WorldBridge {
  keys: { left: boolean; right: boolean; forward: boolean; back: boolean };
  /** Horizontal axis from the mobile joystick (-1..1). */
  joystick: number;
  /** Tap-to-move target in world units; cleared on arrival or manual input. */
  moveTarget: { x: number; z: number } | null;
  /** One-shot quick-travel from the map. */
  teleport: { x: number; z: number } | null;
  /** Written by the scene each frame. */
  playerX: number;
  playerZ: number;
  walking: boolean;
  nearZoneId: string | null;
  reducedMotion: boolean;
  isMobile: boolean;
  onNearZone: (zoneId: string | null) => void;
  onWalkingChange: (walking: boolean) => void;
  onSceneReady: () => void;
  onActivateZone: (zone: Zone) => void;
}

export const worldBridge: WorldBridge = {
  keys: { left: false, right: false, forward: false, back: false },
  joystick: 0,
  moveTarget: null,
  teleport: null,
  playerX: SPAWN_WORLD.x,
  playerZ: SPAWN_WORLD.z,
  walking: false,
  nearZoneId: null,
  reducedMotion: false,
  isMobile: false,
  onNearZone: () => {},
  onWalkingChange: () => {},
  onSceneReady: () => {},
  onActivateZone: () => {},
};

/** Clear transient input (overlays opening, world unmounting, map travel). */
export function resetWorldInput(): void {
  worldBridge.keys = { left: false, right: false, forward: false, back: false };
  worldBridge.joystick = 0;
  worldBridge.moveTarget = null;
  worldBridge.teleport = null;
  worldBridge.nearZoneId = null;
  worldBridge.walking = false;
}
