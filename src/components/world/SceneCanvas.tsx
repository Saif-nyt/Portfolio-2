"use client";

import { Canvas } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { useWorldState } from "@/lib/world/store";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { GalaxySky } from "@/components/world/GalaxySky";

interface SceneCanvasProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  background?: string;
  fog?: { color: string; density: number };
  /** Continuous rendering only while something is animating; idle = paused. */
  animate?: boolean;
  /** Disable pointer interactions during a scene's entry transition. */
  interactive?: boolean;
}

let cachedWebgl: boolean | null = null;
function hasWebGL(): boolean {
  if (cachedWebgl !== null) return cachedWebgl;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cachedWebgl = Boolean(gl);
    // Probe once, then release the context so it never counts against the
    // browser's live-WebGL-context budget.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cachedWebgl = false;
  }
  return cachedWebgl;
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
  interactive = true,
}: SceneCanvasProps) {
  const { quality, activeObject, mapOpen, codex } = useWorldState();
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const webglOk = useMemo(() => hasWebGL(), []);
  const [tabHidden, setTabHidden] = useState(false);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  // Next.js keeps visited routes mounted and hides them with `display:none`
  // (React <Activity>), and @react-three/fiber deliberately keeps its root alive
  // across those hide/show cycles. A route evicted from the cache therefore
  // unmounts without releasing its WebGL context, so rapid navigation exhausts
  // the browser's context budget ("Too many active WebGL contexts. Oldest
  // context will be lost.") and blanks whatever scene is on screen. Insertion
  // effects survive Activity hiding — only a real removal runs their cleanup —
  // so this forces the context down exactly once, when the route is truly gone,
  // leaving the up-to-three retained routes untouched.
  useInsertionEffect(() => {
    return () => {
      const gl = glRef.current;
      glRef.current = null;
      try {
        gl?.forceContextLoss();
      } catch {
        // Context was already released.
      }
    };
  }, []);

  // R3F keeps rendering when the tab is in the background — pause the loop.
  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  if (!webglOk) return null;

  const dpr: [number, number] = quality === "high"
    ? [1, 1.75]
    : isMobile
      ? [1, 1.35]
      : [0.85, 1.1];
  // Idle loops (flora, rings, particles) run only when motion is welcome and
  // nothing is covering the scene; a hidden tab, reduced-motion preference,
  // open panel/map, or open codex all drop to on-demand frames.
  const covered = Boolean(activeObject) || mapOpen || codex !== null;
  const frameloop = animate && !reduced && !tabHidden && !covered ? "always" : "demand";

  return (
    // `touch-action: none` scopes the world's drag navigation to the canvas:
    // touches here never scroll or zoom, while HUD buttons, links and any
    // overlay outside this element keep their normal browser gestures.
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        touchAction: "none",
        pointerEvents: interactive ? "auto" : "none",
        backgroundColor: background,
      }}
    >
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        gl={{
          antialias: quality === "high" || isMobile,
          powerPreference: "high-performance",
          alpha: false,
        }}
        camera={{ fov: isMobile ? Math.max(cameraFov, 64) : cameraFov, near: 0.1, far: 120, position: cameraPosition }}
        onCreated={({ gl }) => {
          glRef.current = gl;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={[background]} />
        {fog ? <fogExp2 attach="fog" args={[fog.color, fog.density]} /> : null}
        <Suspense fallback={null}>
          <GalaxySky quality={quality} reduced={reduced} />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
