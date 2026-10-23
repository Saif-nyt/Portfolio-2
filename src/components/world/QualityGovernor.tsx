"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useWorldState, worldActions } from "@/lib/world/store";

const WINDOW_SECONDS = 4;
const MIN_FPS = 42;
const BAD_WINDOWS_BEFORE_DROP = 2;
/** Ignore the first seconds of shader compilation and route-entry hitching. */
const WARMUP_SECONDS = 2.5;

/**
 * One-way adaptive-quality guard. If a capable-tier device sustains a low
 * frame rate for two consecutive windows, drop the render tier once. It never
 * upgrades automatically (which would oscillate), and it ignores the first
 * slow frames while shaders compile.
 */
export function QualityGovernor() {
  const { quality, activeObject, mapOpen, codex, collectionOpen } = useWorldState();
  const frames = useRef(0);
  const elapsed = useRef(0);
  const badWindows = useRef(0);
  const warmup = useRef(0);

  useFrame((_, rawDelta) => {
    if (quality !== "high") return;
    if (activeObject || mapOpen || codex !== null || collectionOpen) return;
    if (rawDelta > 0.25) return;
    if (warmup.current < WARMUP_SECONDS) {
      warmup.current += rawDelta;
      return;
    }
    frames.current += 1;
    elapsed.current += rawDelta;
    if (elapsed.current < WINDOW_SECONDS) return;

    const fps = frames.current / elapsed.current;
    frames.current = 0;
    elapsed.current = 0;
    if (fps >= MIN_FPS) {
      badWindows.current = 0;
      return;
    }
    badWindows.current += 1;
    if (badWindows.current >= BAD_WINDOWS_BEFORE_DROP) worldActions.setQuality("low");
  });

  return null;
}
