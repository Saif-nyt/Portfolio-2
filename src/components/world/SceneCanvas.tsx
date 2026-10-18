"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useWorldState } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface SceneCanvasProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  background?: string;
  fog?: { color: string; density: number };
  /** Continuous rendering only while something is animating; idle = paused. */
  animate?: boolean;
}

function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Shared browser-only3D canvas. Demand-based by default: the loop runs
 * continuously only while `animate` is true and nothing is covering the scene
 * (no open panel/map, tab visible, motion allowed). DPR adapts to the
 * render-quality tier from the world store.
 */
export function SceneCanvas({
  children,
  cameraPosition = [0, 2.2, 9],
  cameraFov = 42,
  background = "#050d0c",
  fog,
  animate = true,
}: SceneCanvasProps) {
  const { quality, activeObject, mapOpen, codex } = useWorldState();
  const reduced = usePrefersReducedMotion();
  const webglOk = useMemo(() => hasWebGL(), []);
  const [tabHidden, setTabHidden] = useState(false);

  // R3F keeps rendering when the tab is in the background — pause the loop.
  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  if (!webglOk) return null;

  const dpr: [number, number] = quality === "high" ? [1, 1.75] : [0.85, 1.1];
  // Idle loops (flora, rings, particles) run only when motion is welcome and
  // nothing is covering the scene; a hidden tab, reduced-motion preference,
  // open panel/map, or open codex all drop to on-demand frames.
  const covered = Boolean(activeObject) || mapOpen || codex !== null;
  const frameloop = animate && !reduced && !tabHidden && !covered ? "always" : "demand";

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        gl={{
          antialias: quality === "high",
          powerPreference: "high-performance",
          alpha: false,
        }}
        camera={{ fov: cameraFov, near: 0.1, far: 120, position: cameraPosition }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={[background]} />
        {fog ? <fogExp2 attach="fog" args={[fog.color, fog.density]} /> : null}
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
