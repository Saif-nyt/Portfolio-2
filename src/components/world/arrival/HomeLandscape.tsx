"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { homeHeight, homeSlope } from "./home-terrain";
import { causewayDeckHeight, distanceToHomePath, homeWalkHeight, insideClearing } from "./home-world";

type Tier = "high" | "low";

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/* ------------------------------------------------------------------ */
/* Terrain                                                             */
/* ------------------------------------------------------------------ */

function HomeTerrain({ quality }: { quality: Tier }) {
  const palette = useSceneTheme();
  const segments = quality === "high" ? 176 : 104;

  const geometry = useMemo(() => {
    const terrain = new THREE.PlaneGeometry(620, 620, segments, segments);
    const positions = terrain.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(positions.count * 3);
    const heights = new Float32Array(positions.count);
    const valley = new THREE.Color(mixHex(palette.floorDeep, palette.floor, 0.34));
    const highland = new THREE.Color(mixHex(palette.stoneDark, palette.stone, 0.42));
    const rock = new THREE.Color(palette.stoneDark);
    const glow = new THREE.Color(palette.accent("#63f5e7"));
    const color = new THREE.Color();
    const width = segments + 1;
    const spacing = 620 / segments;

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = -positions.getY(i);
      const height = homeHeight(x, z);
      heights[i] = height;
      positions.setZ(i, height);
    }

    // Derive slope from the sampled grid instead of four extra analytic
    // height calls per vertex — a large startup saving on a 30k-vertex mesh.
    for (let i = 0; i < positions.count; i += 1) {
      const ix = i % width;
      const iz = (i / width) | 0;
      const leftIndex = iz * width + Math.max(0, ix - 1);
      const rightIndex = iz * width + Math.min(segments, ix + 1);
      const topIndex = Math.max(0, iz - 1) * width + ix;
      const bottomIndex = Math.min(segments, iz + 1) * width + ix;
      const slope = clamp01(
        Math.hypot(
          (heights[rightIndex] - heights[leftIndex]) / (2 * spacing),
          (heights[bottomIndex] - heights[topIndex]) / (2 * spacing),
        ) * 1.8,
      );
      const height = heights[i];
      const altitude = clamp01((height + 7) / 22);
      color.copy(valley).lerp(highland, altitude).lerp(rock, slope * 0.72);
      // A whisper of bioluminescence in the deepest cut, not a neon wash.
      if (height < -2.5) color.lerp(glow, clamp01((-height - 2.5) / 12) * 0.11);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    terrain.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    terrain.computeVertexNormals();
    terrain.computeBoundingSphere();
    return terrain;
  }, [palette, segments]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0.02} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Monoliths and spires                                                */
/* ------------------------------------------------------------------ */

export interface Spire {
  x: number;
  z: number;
  y: number;
  height: number;
  radius: number;
  rot: number;
  tiltX: number;
  tiltZ: number;
}

export function rockSpires(quality: Tier): Spire[] {
  const target = quality === "high" ? 42 : 22;
  const spires: Spire[] = [];
  let attempt = 0;
  while (spires.length < target && attempt < 700) {
    const seed = 17.3 + attempt * 5.71;
    attempt += 1;
    const angle = hash01(seed) * Math.PI * 2;
    const distance = 32 + Math.pow(hash01(seed + 1.7), 1.2) * 116;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    // Keep the arrival corridor, causeway and temple approach clear.
    if (Math.abs(x) < 12 && z > -84 && z < 24) continue;
    if (Math.abs(x) < 4.5 && z < -22 && z > -52) continue;
    if (Math.hypot(x, z + 72) < 12) continue;
    if (Math.hypot(x, z + 108) < 19) continue;
    if (insideClearing(x, z, 3.2)) continue;
    if (distanceToHomePath(x, z) < 3.6) continue;

    const height = 7 + Math.pow(hash01(seed + 2.9), 1.4) * 30;
    spires.push({
      x,
      z,
      y: homeHeight(x, z) - 0.8,
      height,
      radius: 1.4 + hash01(seed + 4.1) * 4.2,
      rot: hash01(seed + 5.3) * Math.PI * 2,
      tiltX: (hash01(seed + 6.7) - 0.5) * 0.12,
      tiltZ: (hash01(seed + 8.1) - 0.5) * 0.12,
    });
  }
  return spires;
}

function RockSpires({ quality }: { quality: Tier }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const items = useMemo(() => rockSpires(quality), [quality]);
  const geometry = useMemo(() => {
    const shape = new THREE.CylinderGeometry(0.34, 1, 1, 6, 1);
    shape.translate(0, 0.5, 0);
    return shape;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const dark = new THREE.Color(palette.stoneDark);
    const light = new THREE.Color(palette.stoneLight);
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(item.tiltX, item.rot, item.tiltZ);
      dummy.scale.set(item.radius, item.height, item.radius * (0.78 + hash01(i * 3.7) * 0.28));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(dark).lerp(light, hash01(i * 9.1) * 0.34);
      mesh.setColorAt(i, color);
    }
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, palette]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} frustumCulled={false}>
      <meshStandardMaterial color="#ffffff" roughness={0.99} metalness={0.02} flatShading />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Distant alien forest                                                */
/* ------------------------------------------------------------------ */

export interface Tree {
  x: number;
  z: number;
  y: number;
  trunk: number;
  spread: number;
  rot: number;
  tint: number;
}

export function forestTrees(quality: Tier): Tree[] {
  const target = quality === "high" ? 170 : 68;
  const trees: Tree[] = [];
  let attempt = 0;
  while (trees.length < target && attempt < 1400) {
    const seed = 61.7 + attempt * 3.37;
    attempt += 1;
    const angle = hash01(seed) * Math.PI * 2;
    const distance = 38 + Math.pow(hash01(seed + 1.3), 1.35) * 68;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (Math.abs(x) < 10.5 && z > -90 && z < 20) continue;
    if (Math.abs(x) < 4 && z < -23 && z > -50) continue;
    if (Math.hypot(x, z + 72) < 9) continue;
    if (Math.hypot(x, z + 108) < 15) continue;
    if (insideClearing(x, z, 1.4)) continue;
    if (distanceToHomePath(x, z) < 2.8) continue;
    const slope = homeSlope(x, z);
    if (slope > 0.65) continue;
    trees.push({
      x,
      z,
      y: homeHeight(x, z) - 0.22,
      trunk: 2.4 + hash01(seed + 2.1) * 5.4,
      spread: 0.9 + hash01(seed + 3.4) * 1.75,
      rot: hash01(seed + 4.8) * Math.PI * 2,
      tint: hash01(seed + 6.2),
    });
  }
  return trees;
}

function DistantForest({ quality }: { quality: Tier }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const items = useMemo(() => forestTrees(quality), [quality]);

  const trunkGeometry = useMemo(() => {
    const shape = new THREE.CylinderGeometry(0.32, 1, 1, 5, 1);
    shape.translate(0, 0.5, 0);
    return shape;
  }, []);
  const canopyGeometry = useMemo(() => {
    const shape = new THREE.ConeGeometry(1, 1, 5, 1);
    shape.translate(0, 0.5, 0);
    return shape;
  }, []);
  const bulbGeometry = useMemo(() => new THREE.SphereGeometry(0.14, 5, 4), []);

  useLayoutEffect(() => {
    const trunkMesh = trunks.current;
    const canopyMesh = canopies.current;
    const bulbMesh = bulbs.current;
    if (!trunkMesh || !canopyMesh || !bulbMesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const canopyDark = new THREE.Color(mixHex(palette.stoneDark, "#1e5a48", 0.42));
    const canopyLight = new THREE.Color(mixHex(palette.stoneLight, "#3a9a7a", 0.28));

    for (let i = 0; i < items.length; i += 1) {
      const tree = items[i];
      dummy.position.set(tree.x, tree.y, tree.z);
      dummy.rotation.set(0, tree.rot, 0);
      dummy.scale.set(0.16 + tree.tint * 0.12, tree.trunk, 0.16 + tree.tint * 0.12);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tree.x, tree.y + tree.trunk * 0.92, tree.z);
      dummy.rotation.set(0, tree.rot, 0);
      dummy.scale.set(tree.spread, tree.spread * (2.1 + tree.tint * 0.7), tree.spread);
      dummy.updateMatrix();
      canopyMesh.setMatrixAt(i, dummy.matrix);
      color.copy(canopyDark).lerp(canopyLight, tree.tint * 0.85);
      canopyMesh.setColorAt(i, color);

      dummy.position.set(
        tree.x + Math.cos(tree.rot) * tree.spread * 0.3,
        tree.y + tree.trunk + tree.spread * 2.05,
        tree.z + Math.sin(tree.rot) * tree.spread * 0.3,
      );
      dummy.rotation.set(0, tree.rot, 0);
      dummy.scale.setScalar(0.7 + tree.tint * 1.2);
      dummy.updateMatrix();
      bulbMesh.setMatrixAt(i, dummy.matrix);
    }
    trunkMesh.count = items.length;
    canopyMesh.count = items.length;
    bulbMesh.count = items.length;
    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceMatrix.needsUpdate = true;
    bulbMesh.instanceMatrix.needsUpdate = true;
    if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
  }, [items, palette]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeometry, undefined, items.length]} frustumCulled={false}>
        <meshStandardMaterial color={mixHex(palette.stoneDark, "#0b211b", 0.5)} roughness={0.98} flatShading />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[canopyGeometry, undefined, items.length]} frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" roughness={0.92} flatShading emissive={palette.accent("#63f5e7")} emissiveIntensity={0.045 * palette.glow} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[bulbGeometry, undefined, items.length]} frustumCulled={false}>
        <meshStandardMaterial color={palette.accent("#63f5e7")} emissive={palette.accent("#63f5e7")} emissiveIntensity={1.4 * palette.glow} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The Long Causeway                                                   */
/* ------------------------------------------------------------------ */

function Causeway() {
  const palette = useSceneTheme();
  const stone = mixHex(palette.stoneDark, palette.stone, 0.56);
  const deck = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const t = i / 4;
        const z = -31.1 - i * 3.2;
        return {
          z,
          y: causewayDeckHeight(z) - 0.17,
          rotX: (0.5 - t) * 0.055,
        };
      }),
    [],
  );

  return (
    <group>
      {deck.map((segment, i) => (
        <group key={i} position={[0, segment.y, segment.z]} rotation={[segment.rotX, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.7, 0.34, 4.3]} />
            <meshStandardMaterial color={stone} roughness={0.95} flatShading emissive={palette.stone} emissiveIntensity={0.2 * palette.glow} />
          </mesh>
          {[-2.36, 2.36].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.4, 0]} castShadow>
                <boxGeometry args={[0.18, 0.44, 4.4]} />
                <meshStandardMaterial color={mixHex(stone, palette.stoneLight, 0.18)} roughness={0.9} emissive={palette.stone} emissiveIntensity={0.16 * palette.glow} />
              </mesh>
              <mesh position={[x - Math.sign(x) * 0.09, 0.2, 0]}>
                <boxGeometry args={[0.16, 0.06, 4.4]} />
                <meshBasicMaterial color={palette.accent("#63f5e7")} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {[0, 1, 2, 3].map((i) => {
        const z = -27.1 - i * 0.5;
        const top = homeWalkHeight(0, z) + 0.02;
        const ground = homeHeight(0, z) - 0.2;
        const height = Math.max(0.2, top - ground);
        return (
          <mesh key={`step-${i}`} position={[0, top - height / 2, z]} receiveShadow castShadow>
            <boxGeometry args={[4.7, height, 0.56]} />
            <meshStandardMaterial color={stone} roughness={0.96} flatShading emissive={palette.stone} emissiveIntensity={0.16 * palette.glow} />
          </mesh>
        );
      })}
      {[0, 1, 2, 3].map((i) => {
        const z = -46.45 - i * 0.62;
        const ground = homeHeight(0, z);
        const start = causewayDeckHeight(-46) + 0.02;
        const end = homeHeight(0, -48.35) + 0.15;
        const y = start + (end - start) * ((i + 1) / 4);
        return (
          <mesh key={`far-step-${i}`} position={[0, y, z]} receiveShadow castShadow>
            <boxGeometry args={[4.7, Math.max(0.3, y - ground + 0.18), 0.66]} />
            <meshStandardMaterial color={stone} roughness={0.96} flatShading emissive={palette.stone} emissiveIntensity={0.16 * palette.glow} />
          </mesh>
        );
      })}
      {[-31, -35.5, -40, -44.5].map((z) => {
        const ground = homeHeight(0, z);
        const top = 0.42;
        const height = Math.max(1.2, top - ground + 1.2);
        return (
          <mesh key={z} position={[0, top - height / 2, z]} castShadow>
            <cylinderGeometry args={[0.48, 0.72, height, 6]} />
            <meshStandardMaterial color={palette.stoneDark} roughness={0.98} flatShading emissive={palette.stoneDark} emissiveIntensity={0.18 * palette.glow} />
          </mesh>
        );
      })}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.1, 0, -29]}>
          <mesh position={[0, 1.7, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.7, 3.4, 6]} />
            <meshStandardMaterial color={stone} roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 3.55, 0]}>
            <octahedronGeometry args={[0.38, 0]} />
            <meshStandardMaterial color={palette.accent("#63f5e7")} emissive={palette.accent("#63f5e7")} emissiveIntensity={1.3 * palette.glow} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Great Arch                                                          */
/* ------------------------------------------------------------------ */

function GreatArch() {
  const palette = useSceneTheme();
  const baseY = homeHeight(0, -108);
  const stone = mixHex(palette.stoneDark, palette.stone, 0.3);
  return (
    <group position={[0, baseY, -108]}>
      {[-9.5, 9.5].map((x) => (
        <mesh key={x} position={[x, 16, 0]} rotation={[0, 0, x > 0 ? -0.05 : 0.05]} castShadow>
          <cylinderGeometry args={[2.2, 3.9, 32, 7]} />
          <meshStandardMaterial color={stone} roughness={0.99} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 32.3, 0]} castShadow>
        <boxGeometry args={[25, 3.2, 4.4]} />
        <meshStandardMaterial color={stone} roughness={0.98} flatShading />
      </mesh>
      <mesh position={[0, 32.3, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[9.4, 0.85, 6, 20, Math.PI]} />
        <meshStandardMaterial color={mixHex(stone, palette.stoneLight, 0.18)} roughness={0.96} flatShading />
      </mesh>
      <mesh position={[0, 30.7, 2.25]}>
        <boxGeometry args={[10.5, 0.12, 0.12]} />
        <meshBasicMaterial color={palette.accent("#63f5e7")} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating landmarks                                                  */
/* ------------------------------------------------------------------ */

interface Isle {
  angle: number;
  radius: number;
  y: number;
  size: number;
  phase: number;
}

function FloatingLandmarks({ quality, reduced }: { quality: Tier; reduced: boolean }) {
  const palette = useSceneTheme();
  const bases = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  const glows = useRef<THREE.InstancedMesh>(null);
  const count = quality === "high" ? 5 : 3;
  const items = useMemo<Isle[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = 211.7 + i * 8.3;
        return {
          angle: (i / count) * Math.PI * 2 + hash01(seed) * 0.6,
          radius: 46 + hash01(seed + 1.7) * 58,
          y: 22 + hash01(seed + 2.9) * 26,
          size: 1.6 + hash01(seed + 4.1) * 2.6,
          phase: hash01(seed + 5.3) * Math.PI * 2,
        };
      }),
    [count],
  );

  const baseGeometry = useMemo(() => {
    const shape = new THREE.ConeGeometry(1, 1, 6, 1);
    shape.translate(0, 0.5, 0);
    return shape;
  }, []);
  const topGeometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(1, 7, 5), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const place = useCallback(
    (t: number) => {
      const baseMesh = bases.current;
      const topMesh = tops.current;
      const glowMesh = glows.current;
      if (!baseMesh || !topMesh || !glowMesh) return;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const x = Math.cos(item.angle) * item.radius;
        const z = Math.sin(item.angle) * item.radius;
        const y = item.y + Math.sin(t * 0.09 + item.phase) * 0.7;
        const spin = t * 0.012 + item.phase;

        dummy.position.set(x, y - item.size * 1.35, z);
        dummy.rotation.set(Math.PI, spin, 0);
        dummy.scale.set(item.size * 1.2, item.size * 2.4, item.size * 1.2);
        dummy.updateMatrix();
        baseMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y, z);
        dummy.rotation.set(0.1, spin, 0.08);
        dummy.scale.set(item.size * 1.45, item.size * 0.48, item.size * 1.1);
        dummy.updateMatrix();
        topMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y - item.size * 0.32, z);
        dummy.rotation.set(0, spin, 0);
        dummy.scale.set(item.size * 1.02, item.size * 0.12, item.size * 0.82);
        dummy.updateMatrix();
        glowMesh.setMatrixAt(i, dummy.matrix);
      }
      baseMesh.instanceMatrix.needsUpdate = true;
      topMesh.instanceMatrix.needsUpdate = true;
      glowMesh.instanceMatrix.needsUpdate = true;
    },
    [items, dummy],
  );

  useLayoutEffect(() => {
    place(0);
  }, [place]);

  useFrame(({ clock }) => {
    if (reduced) return;
    place(clock.elapsedTime);
  });

  return (
    <group>
      <instancedMesh ref={bases} args={[baseGeometry, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial color={palette.stoneDark} roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={tops} args={[topGeometry, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial color={mixHex(palette.stoneDark, palette.stone, 0.38)} roughness={0.96} flatShading />
      </instancedMesh>
      <instancedMesh ref={glows} args={[glowGeometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color={palette.accent("#63f5e7")} transparent opacity={0.22 * palette.glow} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** The complete Home landscape, layered from near ground to the far horizon. */
export function HomeLandscape({ quality, reduced }: { quality: Tier; reduced: boolean }) {
  return (
    <group>
      <HomeTerrain quality={quality} />
      <RockSpires quality={quality} />
      <DistantForest quality={quality} />
      <Causeway />
      <GreatArch />
      <FloatingLandmarks quality={quality} reduced={reduced} />
    </group>
  );
}
