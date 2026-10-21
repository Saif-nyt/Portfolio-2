"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { createWindMaterial } from "@/lib/world/wind";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { homeHeight, homeSlope } from "./home-terrain";
import { distanceToHomePath, homeIsOnCauseway, HOMESTEADS, insideClearing } from "./home-world";

type Tier = "high" | "low";

interface Blade {
  x: number;
  z: number;
  y: number;
  rot: number;
  scale: number;
  height: number;
  tint: number;
}

const PATH_HALF_WIDTH = 2.6;
const MAP_RADIUS = 2.8;

function blockedForGrass(x: number, z: number): boolean {
  if (distanceToHomePath(x, z) < PATH_HALF_WIDTH - 0.4) return true;
  if (Math.abs(x) < 5.6 && z > 13.5 && z < 21) return true;
  if (homeIsOnCauseway(x, z)) return true;
  if (Math.abs(x) < 2.5 && z <= -24 && z >= -30) return true;
  if (x * x + z * z < MAP_RADIUS * MAP_RADIUS) return true;
  if (Math.hypot(x + 6.6, z - 3.3) < 3.5) return true;
  if (insideClearing(x, z, 0.7)) return true;
  return false;
}

function scatterBlades(quality: Tier): Blade[] {
  // Denser and closer to the walked path: the old field thinned out well
  // before the horizon and read as a bald ground plane from eye height.
  const target = quality === "high" ? 9000 : 4200;
  const blades: Blade[] = [];
  let attempt = 0;
  while (blades.length < target && attempt < target * 8) {
    const seed = 401.7 + attempt * 2.73;
    attempt += 1;

    const angle = hash01(seed) * Math.PI * 2;
    const distance = 3.5 + Math.sqrt(hash01(seed + 1.3)) * 60;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (blockedForGrass(x, z)) continue;
    if (homeSlope(x, z) > 0.62) continue;

    // Broad density waves keep the field from looking machine-scattered.
    const density =
      0.62 +
      Math.sin(x * 0.19 + z * 0.11) * 0.16 +
      Math.sin(x * 0.07 - z * 0.23) * 0.12;
    if (hash01(seed + 2.1) > density) continue;

    blades.push({
      x,
      z,
      y: homeHeight(x, z),
      rot: hash01(seed + 3.7) * Math.PI * 2,
      scale: 0.78 + hash01(seed + 4.9) * 0.66,
      height: 0.3 + hash01(seed + 6.3) * 0.48,
      tint: hash01(seed + 8.1),
    });
  }
  const yardCount = quality === "high" ? 360 : 160;
  for (let homeIndex = 0; homeIndex < HOMESTEADS.length; homeIndex += 1) {
    const home = HOMESTEADS[homeIndex];
    for (let i = 0; i < yardCount; i += 1) {
      const seed = 9001.3 + homeIndex * 791.7 + i * 2.13;
      const angle = hash01(seed) * Math.PI * 2;
      const distance = 7.1 + Math.sqrt(hash01(seed + 1.7)) * 4.6;
      const x = home.position[0] + Math.cos(angle) * distance;
      const z = home.position[2] + Math.sin(angle) * distance;
      if (blockedForGrass(x, z)) continue;
      if (homeSlope(x, z) > 0.62) continue;
      blades.push({
        x,
        z,
        y: homeHeight(x, z),
        rot: hash01(seed + 3.7) * Math.PI * 2,
        scale: 0.74 + hash01(seed + 4.9) * 0.6,
        height: 0.28 + hash01(seed + 6.3) * 0.42,
        tint: hash01(seed + 8.1),
      });
    }
  }

  return blades;
}

function makeBlade(): THREE.BufferGeometry {
  // Slightly wider and taller than the original hair-thin sliver so blades
  // still read as ground cover from the walking eye height.
  const geometry = new THREE.PlaneGeometry(0.048, 1, 1, 3);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i) + 0.5;
    const t = y;
    positions.setY(i, y);
    positions.setX(i, positions.getX(i) * (1 - t * 0.86));
    positions.setZ(i, t * t * 0.13);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function HomeGrass({ quality, reduced }: { quality: Tier; reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const blades = useMemo(() => scatterBlades(quality), [quality]);
  const geometry = useMemo(() => makeBlade(), []);

  const wind = useMemo(
    () =>
      createWindMaterial({
        color: palette.isLight
          ? mixHex(palette.floorDeep, "#6f7e44", 0.5)
          : mixHex(palette.floorDeep, "#23513a", 0.5),
        emissive: palette.isLight ? "#4d5f2f" : "#0d2b1d",
        emissiveIntensity: palette.isLight ? 0.06 : 0.14,
        amp: reduced ? 0 : 0.14,
        height: 1,
        doubleSide: true,
        roughness: 0.96,
      }),
    [palette, reduced],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < blades.length; i += 1) {
      const blade = blades[i];
      euler.set(0, blade.rot, 0);
      quaternion.setFromEuler(euler);
      position.set(blade.x, blade.y - 0.02, blade.z);
      scale.set(blade.scale, blade.height, blade.scale);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);

      color.setScalar(0.66 + blade.tint * 0.46);
      mesh.setColorAt(i, color);
    }
    mesh.count = blades.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [blades]);

  useFrame(({ clock, camera }) => {
    const mesh = ref.current;
    if (reduced || !mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    const handle = material.userData.wind as
      | { time: THREE.IUniform<number>; player: THREE.IUniform<THREE.Vector2> }
      | undefined;
    if (!handle) return;
    handle.time.value = clock.elapsedTime;
    handle.player.value.set(camera.position.x, camera.position.z);
  });

  return (
    <instancedMesh ref={ref} args={[geometry, wind.material, blades.length]} frustumCulled={false} />
  );
}
