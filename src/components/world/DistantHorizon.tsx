"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";

interface DistantHorizonProps {
  accent?: string;
  /** Larger values push the whole horizon farther out (Home uses a wider ring). */
  scale?: number;
  /** Render fewer silhouettes for weaker devices. */
  quality?: "high" | "low";
  /** Disable the floating islands when the host scene supplies its own. */
  floating?: boolean;
}

interface Silhouette {
  angle: number;
  radius: number;
  width: number;
  height: number;
  tilt: number;
}

function makeSilhouettes(
  count: number,
  seed: number,
  radiusMin: number,
  radiusMax: number,
  heightMin: number,
  heightMax: number,
): Silhouette[] {
  return Array.from({ length: count }, (_, i) => {
    const s = seed + i * 9.17;
    return {
      angle: (i / count) * Math.PI * 2 + (hash01(s) - 0.5) * 0.22,
      radius: radiusMin + hash01(s + 1.1) * (radiusMax - radiusMin),
      width: 5 + hash01(s + 2.3) * 13,
      height: heightMin + hash01(s + 3.7) * (heightMax - heightMin),
      tilt: (hash01(s + 4.9) - 0.5) * 0.18,
    };
  });
}

function buildHorizon(scale: number, quality: "high" | "low") {
  return {
    far: makeSilhouettes(
      quality === "high" ? 22 : 13,
      13.7,
      72 * scale,
      104 * scale,
      18 * scale,
      38 * scale,
    ),
    near: makeSilhouettes(
      quality === "high" ? 18 : 11,
      71.3,
      44 * scale,
      68 * scale,
      9 * scale,
      22 * scale,
    ),
  };
}

export interface HorizonCollider {
  x: number;
  z: number;
  r: number;
}

/** Collision footprints for the walkable Home frontier. */
export function distantHorizonColliders(scale = 1, quality: "high" | "low" = "high"): HorizonCollider[] {
  const { far, near } = buildHorizon(scale, quality);
  return [...near, ...far].map((item) => ({
    x: Math.cos(item.angle) * item.radius,
    z: Math.sin(item.angle) * item.radius,
    r: item.width * 0.48 + 0.5,
  }));
}

/**
 * A cheap, static ring of layered ridges and floating rock islands. Each layer
 * is a single instanced mesh, so every destination gains believable distance
 * and scale without adding per-frame work or extra draw calls per peak.
 */
export function DistantHorizon({
  accent = "#63f5e7",
  scale = 1,
  quality = "high",
  floating: showFloating = true,
}: DistantHorizonProps) {
  const palette = useSceneTheme();
  const farRef = useRef<THREE.InstancedMesh>(null);
  const nearRef = useRef<THREE.InstancedMesh>(null);
  const floatRef = useRef<THREE.InstancedMesh>(null);

  const { far, near } = useMemo(() => buildHorizon(scale, quality), [quality, scale]);
  const floating = useMemo(
    () =>
      Array.from({ length: showFloating ? (quality === "high" ? 7 : 4) : 0 }, (_, i) => {
        const s = 121.9 + i * 6.3;
        return {
          angle: (i / 7) * Math.PI * 2 + hash01(s) * 0.5,
          radius: (30 + hash01(s + 1.3) * 32) * scale,
          y: (11 + hash01(s + 2.7) * 18) * Math.max(0.7, scale),
          size: (2.1 + hash01(s + 3.1) * 4.2) * scale,
          spin: hash01(s + 4.4) * Math.PI * 2,
        };
      }),
    [quality, scale, showFloating],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const apply = (mesh: THREE.InstancedMesh | null, items: Silhouette[], yBase: number) => {
      if (!mesh) return;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        dummy.position.set(
          Math.cos(item.angle) * item.radius,
          yBase,
          Math.sin(item.angle) * item.radius,
        );
        dummy.rotation.set(item.tilt, item.angle, 0);
        dummy.scale.set(item.width, item.height, item.width * 0.72);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    apply(farRef.current, far, -4);
    apply(nearRef.current, near, -3);

    const islands = floatRef.current;
    if (islands) {
      for (let i = 0; i < floating.length; i += 1) {
        const item = floating[i];
        dummy.position.set(
          Math.cos(item.angle) * item.radius,
          item.y,
          Math.sin(item.angle) * item.radius,
        );
        dummy.rotation.set(Math.PI, item.spin, 0.08);
        dummy.scale.set(item.size, item.size * 1.8, item.size);
        dummy.updateMatrix();
        islands.setMatrixAt(i, dummy.matrix);
      }
      islands.instanceMatrix.needsUpdate = true;
    }
  }, [far, near, floating]);

  const farColor = mixHex(palette.stoneDark, palette.fog, palette.isLight ? 0.55 : 0.3);
  const nearColor = mixHex(palette.stoneDark, palette.fog, palette.isLight ? 0.3 : 0.12);
  const islandColor = mixHex(palette.stoneDark, palette.accent(accent), 0.12);

  return (
    <group>
      <instancedMesh ref={farRef} args={[undefined, undefined, far.length]} frustumCulled={false}>
        <coneGeometry args={[1, 1, 5, 1]} />
        <meshStandardMaterial color={farColor} roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={nearRef} args={[undefined, undefined, near.length]} frustumCulled={false}>
        <coneGeometry args={[1, 1, 6, 1]} />
        <meshStandardMaterial color={nearColor} roughness={1} flatShading />
      </instancedMesh>
      {showFloating ? (
        <instancedMesh ref={floatRef} args={[undefined, undefined, floating.length]} frustumCulled={false}>
          <coneGeometry args={[1, 1, 6, 1]} />
          <meshStandardMaterial
            color={islandColor}
            emissive={palette.accent(accent)}
            emissiveIntensity={0.08 * palette.glow}
            roughness={0.96}
            flatShading
          />
        </instancedMesh>
      ) : null}
    </group>
  );
}
