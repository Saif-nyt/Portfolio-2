"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  addLookInput,
  consumeLookInput,
  getWalkInput,
  resetWalkInput,
  useWorldState,
  worldActions,
} from "@/lib/world/store";
import { homeSlope } from "./home-terrain";
import {
  HOME_BOUNDARY,
  HOME_EYE_HEIGHT,
  HOME_PLAYER_RADIUS,
  homeIsOnCauseway,
  homeWalkHeight,
} from "./home-world";
import { homeColliders, type HomeCollider } from "./home-colliders";
import { CAMPFIRE_SPOTS, HOMESTEADS } from "./home-world";

const WALK_SPEED = 4.1;
const SPRINT_SPEED = 7.0;
const LOOK_SENSITIVITY = 0.0023;
const PITCH_LIMIT = 1.15;
interface Proximity {
  x: number;
  z: number;
  r: number;
  label: string;
}

const PROXIMITY: Proximity[] = [
  { x: 0, z: 0, r: 3.8, label: "The Illuminated Map · open the star chart" },
  { x: 0, z: 17, r: 7, label: "The Frontier Gate · the way back out" },
  { x: 0, z: -38, r: 7.5, label: "The Long Causeway · a crossing over the ravine" },
  { x: -26, z: -86, r: 17, label: "Temple of the Far Ridge" },
  { x: 0, z: -108, r: 15, label: "The Great Arch · older than the map" },
  ...CAMPFIRE_SPOTS.map((spot) => ({
    x: spot.position[0],
    z: spot.position[2],
    r: 4.1,
    label: "Campfire · the clearing is warm",
  })),
  ...HOMESTEADS.map((home) => ({
    x: home.position[0],
    z: home.position[2],
    r: 7.5,
    label: "Homestead · warm windows in the grass",
  })),
];

const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "shift",
]);

interface WalkControllerProps {
  active: boolean;
  quality: "high" | "low";
  reduced: boolean;
}

/**
 * First-person walking for the Home frontier. Samples the terrain height field
 * every frame, keeps the camera at eye level, resolves circles/trees/ruins and
 * the causeway rails, and reads movement + look input from mutable stores so
 * no React state updates occur while walking.
 */
export function WalkController({ active, quality, reduced }: WalkControllerProps) {
  const { camera } = useThree();
  const { activeObject, mapOpen, codex, collectionOpen } = useWorldState();
  const blocked = Boolean(activeObject) || mapOpen || codex !== null || collectionOpen;
  const colliders = useMemo(() => homeColliders(quality), [quality]);

  const activeRef = useRef(false);
  const keys = useRef(new Set<string>());
  const player = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const direction = useRef(new THREE.Vector3());
  const bobPhase = useRef(0);
  const bobAmount = useRef(0);

  // Keyboard is captured only while walking, so it never steals typing from
  // form fields elsewhere on the page.
  useEffect(() => {
    if (!active) return;
    const pressed = keys.current;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(key)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (key.startsWith("arrow")) event.preventDefault();
      pressed.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressed.delete(event.key.toLowerCase());
    };
    const onBlur = () => pressed.clear();
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      pressed.clear();
      resetWalkInput();
      consumeLookInput();
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      pressed.clear();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  // Optional pointer lock: once captured, raw mouse deltas drive the look.
  useEffect(() => {
    if (!active) return;
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement) addLookInput(event.movementX, event.movementY);
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const pressed = keys.current;
    return () => {
      resetWalkInput();
      pressed.clear();
    };
  }, [active]);

  useEffect(() => {
    if (blocked && document.pointerLockElement) document.exitPointerLock();
  }, [blocked]);

  const canStand = (x: number, z: number): boolean => {
    if (x * x + z * z > HOME_BOUNDARY * HOME_BOUNDARY) return false;
    if (homeIsOnCauseway(x, z)) {
      if (Math.abs(x) > 1.78) return false;
    } else if (homeSlope(x, z) > 0.92) {
      return false;
    }
    for (let i = 0; i < colliders.length; i += 1) {
      const collider: HomeCollider = colliders[i];
      const dx = x - collider.x;
      const dz = z - collider.z;
      const reach = collider.r + HOME_PLAYER_RADIUS;
      if (dx * dx + dz * dz < reach * reach) return false;
    }
    return true;
  };

  // Spawn recovery: the cinematic hands the camera over wherever it finished,
  // which can leave the player inside a collider or on a cliff face. Walk a
  // few rings outward for the nearest standable point, then fall back to the
  // gate approach (always walkable) rather than strand the visitor inside
  // geometry where every step is blocked.
  const resolveSpawn = (x: number, z: number): { x: number; z: number } => {
    if (canStand(x, z)) return { x, z };
    for (let ring = 1; ring <= 8; ring += 1) {
      const radius = ring * 1.1;
      const samples = 8 + ring * 4;
      for (let i = 0; i < samples; i += 1) {
        const angle = (i / samples) * Math.PI * 2;
        const sx = x + Math.cos(angle) * radius;
        const sz = z + Math.sin(angle) * radius;
        if (canStand(sx, sz)) return { x: sx, z: sz };
      }
    }
    return { x: 0, z: 8 };
  };

  useFrame((_, delta) => {
    if (!active) {
      if (activeRef.current) {
        activeRef.current = false;
        velocity.current.set(0, 0, 0);
        worldActions.setNearby(null);
      }
      return;
    }

    if (!activeRef.current) {
      activeRef.current = true;
      camera.getWorldDirection(direction.current);
      yaw.current = Math.atan2(-direction.current.x, -direction.current.z);
      pitch.current = Math.asin(THREE.MathUtils.clamp(direction.current.y, -1, 1));
      const spawn = resolveSpawn(camera.position.x, camera.position.z);
      player.current.set(
        spawn.x,
        homeWalkHeight(spawn.x, spawn.z) + HOME_EYE_HEIGHT,
        spawn.z,
      );
      // Snap straight to eye height so the handover doesn't drop the camera
      // from the cinematic's altitude.
      camera.position.copy(player.current);
      velocity.current.set(0, 0, 0);
    }

    const look = consumeLookInput();
    if (blocked) {
      velocity.current.x = 0;
      velocity.current.z = 0;
      worldActions.setNearby(null);
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }

    yaw.current -= look.x * LOOK_SENSITIVITY;
    pitch.current = THREE.MathUtils.clamp(
      pitch.current - look.y * LOOK_SENSITIVITY,
      -PITCH_LIMIT,
      PITCH_LIMIT,
    );

    const dt = Math.min(delta, 0.05);
    let forward = 0;
    let strafe = 0;
    if (keys.current.has("w") || keys.current.has("arrowup")) forward += 1;
    if (keys.current.has("s") || keys.current.has("arrowdown")) forward -= 1;
    if (keys.current.has("d") || keys.current.has("arrowright")) strafe += 1;
    if (keys.current.has("a") || keys.current.has("arrowleft")) strafe -= 1;

    const joystick = getWalkInput();
    forward += joystick.y;
    strafe += joystick.x;
    const magnitude = Math.hypot(forward, strafe);
    if (magnitude > 1) {
      forward /= magnitude;
      strafe /= magnitude;
    }

    const sprint = keys.current.has("shift") ? SPRINT_SPEED / WALK_SPEED : 1;
    const speed = WALK_SPEED * sprint;
    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    const desiredX = (-sin * forward + cos * strafe) * speed;
    const desiredZ = (-cos * forward - sin * strafe) * speed;

    const response = magnitude > 0.02 ? 11 : 15;
    velocity.current.x = THREE.MathUtils.damp(velocity.current.x, desiredX, response, dt);
    velocity.current.z = THREE.MathUtils.damp(velocity.current.z, desiredZ, response, dt);
    if (Math.abs(velocity.current.x) < 0.002) velocity.current.x = 0;
    if (Math.abs(velocity.current.z) < 0.002) velocity.current.z = 0;

    const stepX = velocity.current.x * dt;
    const stepZ = velocity.current.z * dt;
    const stepLength = Math.hypot(stepX, stepZ);
    if (stepLength > 1e-5) {
      const baseAngle = Math.atan2(stepZ, stepX);
      const slices = Math.min(4, Math.max(1, Math.ceil(stepLength / 0.2)));
      const sliceX = stepX / slices;
      const sliceZ = stepZ / slices;
      for (let slice = 0; slice < slices; slice += 1) {
        if (canStand(player.current.x + sliceX, player.current.z + sliceZ)) {
          player.current.x += sliceX;
          player.current.z += sliceZ;
          continue;
        }
        // Round obstacles and walls shouldn't dead-stop the walk. Deflect the
        // step toward the first clear direction, preferring the smallest turn,
        // so the player slides around the map pedestal, trees and ruins.
        let moved = false;
        for (const offset of [0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.5, -1.5]) {
          const scale = Math.cos(offset);
          const dx = (Math.cos(baseAngle + offset) * stepLength * scale) / slices;
          const dz = (Math.sin(baseAngle + offset) * stepLength * scale) / slices;
          if (canStand(player.current.x + dx, player.current.z + dz)) {
            player.current.x += dx;
            player.current.z += dz;
            moved = true;
            break;
          }
        }
        if (!moved) {
          velocity.current.x = 0;
          velocity.current.z = 0;
          break;
        }
      }
    }

    const ground = homeWalkHeight(player.current.x, player.current.z);
    const targetY = ground + HOME_EYE_HEIGHT;
    player.current.y = THREE.MathUtils.damp(player.current.y, targetY, 18, dt);

    camera.position.set(player.current.x, player.current.y, player.current.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    // Subtle, speed-scaled head bob. It is purely visual (never changes the
    // player position) and is disabled with reduced motion.
    if (!reduced) {
      const groundSpeed = Math.hypot(velocity.current.x, velocity.current.z);
      const targetAmount = groundSpeed > 0.08
        ? Math.min(0.026, groundSpeed * 0.0044)
        : 0;
      bobAmount.current = THREE.MathUtils.damp(bobAmount.current, targetAmount, 9, dt);
      if (groundSpeed > 0.08) bobPhase.current += dt * (5.4 + groundSpeed * 1.15);
      if (bobAmount.current > 0.0002) {
        camera.position.set(
          player.current.x,
          player.current.y + Math.sin(bobPhase.current) * bobAmount.current,
          player.current.z,
        );
      }
    }

    let nearby: string | null = null;
    let nearest = Infinity;
    for (let i = 0; i < PROXIMITY.length; i += 1) {
      const spot = PROXIMITY[i];
      const dx = player.current.x - spot.x;
      const dz = player.current.z - spot.z;
      const distance = Math.hypot(dx, dz);
      if (distance < spot.r && distance < nearest) {
        nearest = distance;
        nearby = spot.label;
      }
    }
    worldActions.setNearby(nearby);
  });

  return null;
}
