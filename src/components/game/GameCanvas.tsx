"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { WorldScene } from "@/components/game/WorldScene";

/**
 * Browser-only R3F canvas. Mounted exclusively through GameWorld, which is
 * itself loaded with ssr: false — no window access happens on the server.
 */
export function GameCanvas({
  natureDensity,
  shadows,
  sporeCount,
}: {
  natureDensity: number;
  shadows: boolean;
  sporeCount: number;
}) {
  return (
    <Canvas
      dpr={[1, shadows ? 1.75 : 1.4]}
      shadows={shadows}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 140,
        position: [SPAWN_CAM.x, SPAWN_CAM.y, SPAWN_CAM.z],
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        // three r18x removed PCFSoftShadowMap — request PCF explicitly.
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Scene tone — must attach directly to the scene root. */}
      <color attach="background" args={["#050d0c"]} />
      <fogExp2 attach="fog" args={["#07110f", 0.052]} />
      <Suspense fallback={null}>
        <WorldScene natureDensity={natureDensity} shadows={shadows} sporeCount={sporeCount} />
      </Suspense>
    </Canvas>
  );
}

const SPAWN_CAM = { x: 1.6, y: 4.6, z: 7.4 };
