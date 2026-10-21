"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Camera positions along the entry flight, from the exterior shot to inside. */
const ENTRY_POSITIONS: [number, number, number][] = [
  [0, 6.2, 35],
  [0, 5.7, 30],
  [0, 4.9, 24],
  [0, 4.25, 19],
  [0, 3.95, 16.2],
  [0, 3.45, 12],
  [0, 3.2, 10],
];

/** Matching look targets, so the gaze leads the camera through the opening. */
const ENTRY_TARGETS: [number, number, number][] = [
  [0, 4.3, 17],
  [0, 4.15, 17],
  [0, 3.7, 13],
  [0, 3.1, 7],
  [0, 2.2, 1],
  [0, 1.9, -8],
  [0, 2.2, -24],
];

  const FLIGHT_SECONDS = 5.0;
  const ANTICIPATION_SECONDS = 0.5;

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

interface GateCinematicProps {
  /** True while the visitor is in the gate-entry transition. */
  active: boolean;
  /** True once the doors report full clearance. */
  cleared: boolean;
  /** Visitor asked to skip the flight (always available, even mid-entry). */
  skip?: boolean;
  reduced: boolean;
  /** Fired when the camera has settled inside — the single arrival event. */
  onComplete: () => void;
}

/**
 * Scripted gate-entry sequence. It owns the camera only while `active`, waits
 * for the actual door-clearance event before moving, then flies a single eased
 * path through the opening. No black frames, no teleport, no fixed timeouts.
 */
export function GateCinematic({ active, cleared, skip = false, reduced, onComplete }: GateCinematicProps) {
  const { camera } = useThree();
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        ENTRY_POSITIONS.map((point) => new THREE.Vector3(...point)),
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );
  const lookCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        ENTRY_TARGETS.map((point) => new THREE.Vector3(...point)),
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );
  const point = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const startAt = useRef<number | null>(null);
  const completed = useRef(false);
  const wasActive = useRef(false);

  useFrame(({ clock }) => {
    if (!active) {
      wasActive.current = false;
      startAt.current = null;
      completed.current = false;
      return;
    }

    if (!wasActive.current) {
      wasActive.current = true;
      completed.current = false;
      startAt.current = null;
      camera.position.set(...ENTRY_POSITIONS[0]);
      camera.lookAt(ENTRY_TARGETS[0][0], ENTRY_TARGETS[0][1], ENTRY_TARGETS[0][2]);
    }

    // A skip jumps straight to the authored interior pose — never to the
    // exterior with the door still swinging behind the visitor.
    if (skip) {
      if (!completed.current) {
        completed.current = true;
        camera.position.set(...ENTRY_POSITIONS[ENTRY_POSITIONS.length - 1]);
        camera.lookAt(...ENTRY_TARGETS[ENTRY_TARGETS.length - 1]);
        onComplete();
      }
      return;
    }

    if (!cleared) {
      // Hold the exterior composition while the massive leaves swing clear.
      camera.position.set(...ENTRY_POSITIONS[0]);
      camera.lookAt(ENTRY_TARGETS[0][0], ENTRY_TARGETS[0][1], ENTRY_TARGETS[0][2]);
      return;
    }

    if (reduced) {
      if (!completed.current) {
        completed.current = true;
        camera.position.set(...ENTRY_POSITIONS[ENTRY_POSITIONS.length - 1]);
        camera.lookAt(...ENTRY_TARGETS[ENTRY_TARGETS.length - 1]);
        onComplete();
      }
      return;
    }

    if (startAt.current === null) {
      startAt.current = clock.elapsedTime + ANTICIPATION_SECONDS;
    }

    const elapsed = clock.elapsedTime - startAt.current;
    if (elapsed <= 0) {
      camera.position.set(...ENTRY_POSITIONS[0]);
      camera.lookAt(ENTRY_TARGETS[0][0], ENTRY_TARGETS[0][1], ENTRY_TARGETS[0][2]);
      return;
    }

    const progress = Math.min(1, elapsed / FLIGHT_SECONDS);
    const eased = easeInOutSine(progress);
    curve.getPointAt(eased, point);
    lookCurve.getPointAt(eased, look);
    camera.position.copy(point);
    camera.lookAt(look);

    if (progress >= 1 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  return null;
}
