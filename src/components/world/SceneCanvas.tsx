"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useWorldState } from "@/lib/world/store";

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
 * Shared browser-only3D canvas. Uses demand-based rendering: when `animate`
 * is false the frame loop idles, so static or panel-only moments cost ~nothing.
 * DPR adapts to the render-quality tier from the world store.
 */
export function SceneCanvas({
  children,
  cameraPosition = [0, 2.2, 9],
  cameraFov = 42,
  background = "#050d0c",
  fog,
  animate = true,
}: SceneCanvasProps) {
  const { quality } = useWorldState();
  const webglOk = useMemo(() => hasWebGL(), []);

  // Pause rendering when the tab is hidden — saves battery and GPU.
  useEffect(() => {
    if (!webglOk) return;
    // R3F handles visibility internally via frameloop; nothing else needed.
  }, [webglOk]);

  if (!webglOk) return null;

  const dpr: [number, number] = quality === "high" ? [1, 1.75] : [0.85, 1.1];

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={animate ? "always" : "demand"}
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
