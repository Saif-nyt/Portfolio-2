"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONES } from "@/data/zones";
import { zoneToWorldX } from "@/components/game/world-bridge";

/** Deterministic PRNG so the scatter is identical every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tint = {
  /** Target colour to lerp the base material toward. */
  color?: string;
  /** 0..1 — how far to push the base colour toward the target. */
  lerp?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

interface ScatterEntry {
  x: number;
  z: number;
  rot: number;
  scale: number;
}

function scatter(rand: () => number, count: number, opts: { zMin: number; zMax: number }): ScatterEntry[] {
  const entries: ScatterEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    entries.push({
      x: 2 + rand() * 52,
      z: opts.zMin + rand() * (opts.zMax - opts.zMin),
      rot: rand() * Math.PI * 2,
      scale: 0.7 + rand() * 0.8,
    });
  }
  return entries;
}

/** Keep props from burying zone structures or blocking the spawn pad. */
const ZONE_CLEARANCE = 3.2;
function awayFromStructures(entry: ScatterEntry): boolean {
  return !ZONES.some((zone) => Math.abs(zoneToWorldX(zone.x) - entry.x) < ZONE_CLEARANCE);
}

const TINTS = {
  tree: { color: "#2a6b55", lerp: 0.55, emissive: "#0d3f38", emissiveIntensity: 0.18 },
  rock: { color: "#3d5a52", lerp: 0.5 },
  mushroomGlow: { color: "#1d5a4e", emissive: "#63f5e7", emissiveIntensity: 0.85 },
  mushroomTan: { color: "#3a5a44", emissive: "#37d6c5", emissiveIntensity: 0.45 },
  bush: { color: "#1f6653", lerp: 0.5, emissive: "#0d3f38", emissiveIntensity: 0.22 },
  grass: { color: "#2c7a5f", lerp: 0.45, emissive: "#0d3f38", emissiveIntensity: 0.15 },
  flower: { color: "#2a7a64", emissive: "#63f5e7", emissiveIntensity: 0.5 },
  log: { color: "#4a4536", lerp: 0.45 },
  cliff: { color: "#24453c", lerp: 0.5 },
} as const;

/**
 * Loads the Kenney nature GLBs once, tints them toward the bioluminescent
 * palette, and places deterministic scatter along the path edges.
 */
export function NatureScatter({ density }: { density: number }) {
  const treeA = useGLTF("/nature/tree_oak_dark.glb");
  const treeB = useGLTF("/nature/tree_detailed_dark.glb");
  const treeC = useGLTF("/nature/tree_cone_dark.glb");
  const treeD = useGLTF("/nature/tree_palmBend.glb");
  const rockA = useGLTF("/nature/rock_largeA.glb");
  const rockB = useGLTF("/nature/rock_largeB.glb");
  const rockC = useGLTF("/nature/rock_smallE.glb");
  const mushRed = useGLTF("/nature/mushroom_redGroup.glb");
  const mushTan = useGLTF("/nature/mushroom_tanTall.glb");
  const bush = useGLTF("/nature/plant_bushDetailed.glb");
  const grass = useGLTF("/nature/grass_leafsLarge.glb");
  const flower = useGLTF("/nature/flower_purpleB.glb");
  const log = useGLTF("/nature/log_stackLarge.glb");
  const stump = useGLTF("/nature/stump_roundDetailed.glb");
  const cliff = useGLTF("/nature/cliff_top_rock.glb");

  const masters = useMemo(() => {
    const build = (loaded: { scene: THREE.Group }, tint: Tint) => {
      const clone = loaded.scene.clone(true);
      const target = tint.color ? new THREE.Color(tint.color) : null;
      const amount = tint.lerp ?? 0.6;
      clone.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.material) return;
        // Preserve single-vs-array shape: an array material on a geometry
        // without draw groups renders nothing.
        const wasArray = Array.isArray(child.material);
        const originals: THREE.Material[] = wasArray ? child.material : [child.material];
        const mapped = originals.map((original: THREE.Material) => {
          const material = original.clone() as THREE.MeshStandardMaterial;
          if (target && material.color) material.color.lerp(target, amount);
          if (tint.emissive && material.emissive) {
            material.emissive = new THREE.Color(tint.emissive);
            material.emissiveIntensity = tint.emissiveIntensity ?? 0.8;
          }
          return material;
        });
        child.material = wasArray ? (mapped as THREE.Material[]) : mapped[0];
      });
      return clone;
    };
    return {
      treeA: build(treeA, TINTS.tree),
      treeB: build(treeB, TINTS.tree),
      treeC: build(treeC, TINTS.tree),
      treeD: build(treeD, TINTS.tree),
      rockA: build(rockA, TINTS.rock),
      rockB: build(rockB, TINTS.rock),
      rockC: build(rockC, TINTS.rock),
      mushRed: build(mushRed, TINTS.mushroomGlow),
      mushTan: build(mushTan, TINTS.mushroomTan),
      bush: build(bush, TINTS.bush),
      grass: build(grass, TINTS.grass),
      flower: build(flower, TINTS.flower),
      log: build(log, TINTS.log),
      stump: build(stump, TINTS.log),
      cliff: build(cliff, TINTS.cliff),
    };
  }, [treeA, treeB, treeC, treeD, rockA, rockB, rockC, mushRed, mushTan, bush, grass, flower, log, stump, cliff]);

  const layout = useMemo(() => {
    const rand = mulberry32(0x5eed);
    const d = density;
    const left = { zMin: -6.4, zMax: -2.2 };
    const right = { zMin: 2.2, zMax: 6.4 };
    const clear = (entries: ScatterEntry[]) => entries.filter(awayFromStructures);
    return {
      trees: clear([
        ...scatter(rand, Math.round(9 * d), left),
        ...scatter(rand, Math.round(9 * d), right),
      ]),
      rocks: clear([
        ...scatter(rand, Math.round(8 * d), left),
        ...scatter(rand, Math.round(8 * d), right),
      ]),
      mushrooms: clear([
        ...scatter(rand, Math.round(7 * d), { zMin: -2.6, zMax: -1.4 }),
        ...scatter(rand, Math.round(7 * d), { zMin: 1.4, zMax: 2.6 }),
      ]),
      bushes: clear(scatter(rand, Math.round(14 * d), { zMin: -5.5, zMax: 5.5 })),
      grasses: clear(scatter(rand, Math.round(20 * d), { zMin: -5, zMax: 5 })),
      flowers: clear(scatter(rand, Math.round(9 * d), { zMin: -3, zMax: 3 })),
      logs: clear(scatter(rand, Math.round(4 * d), { zMin: -5, zMax: 5 })),
      cliffs: clear(
        scatter(rand, Math.round(7 * d), { zMin: -7.2, zMax: -5.6 }).concat(
          scatter(rand, Math.round(7 * d), { zMin: 5.6, zMax: 7.2 }),
        ),
      ),
      treesMaster: [masters.treeA, masters.treeB, masters.treeC, masters.treeD],
      rocksMaster: [masters.rockA, masters.rockB, masters.rockC],
      mushMaster: [masters.mushRed, masters.mushTan],
    };
  }, [masters, density]);

  const pick = <T,>(list: T[], rand: number) => list[Math.floor(rand * list.length) % list.length];

  return (
    <group>
      {layout.trees.map((entry, i) => (
        <primitive
          key={`tree-${i}`}
          object={pick(layout.treesMaster, (i * 0.37) % 1).clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 1.15}
        />
      ))}
      {layout.rocks.map((entry, i) => (
        <primitive
          key={`rock-${i}`}
          object={pick(layout.rocksMaster, (i * 0.53) % 1).clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.9}
        />
      ))}
      {layout.mushrooms.map((entry, i) => (
        <primitive
          key={`mush-${i}`}
          object={pick(layout.mushMaster, (i * 0.61) % 1).clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.85}
        />
      ))}
      {layout.bushes.map((entry, i) => (
        <primitive
          key={`bush-${i}`}
          object={masters.bush.clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.8}
        />
      ))}
      {layout.grasses.map((entry, i) => (
        <primitive
          key={`grass-${i}`}
          object={masters.grass.clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.7}
        />
      ))}
      {layout.flowers.map((entry, i) => (
        <primitive
          key={`flower-${i}`}
          object={masters.flower.clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.6}
        />
      ))}
      {layout.logs.map((entry, i) => (
        <primitive
          key={`log-${i}`}
          object={(i % 2 === 0 ? masters.log : masters.stump).clone()}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 0.9}
        />
      ))}
      {layout.cliffs.map((entry, i) => (
        <primitive
          key={`cliff-${i}`}
          object={masters.cliff.clone()}
          position={[entry.x, -0.15, entry.z]}
          rotation={[0, entry.rot, 0]}
          scale={entry.scale * 1.6}
        />
      ))}
    </group>
  );
}

/** Slowly bobbing floating islands built from KayKit rock formations. */
export function FloatingIslands({ reduced }: { reduced: boolean }) {
  const rockA = useGLTF("/models/kaykit/rock_A.gltf");
  const rocksB = useGLTF("/models/kaykit/rocks_B.gltf");

  const masters = useMemo(() => {
    const tintOne = (loaded: { scene: THREE.Group }) => {
      const clone = loaded.scene.clone(true);
      const target = new THREE.Color("#0f2f29");
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.color) material.color.lerp(target, 0.6);
        }
      });
      return clone;
    };
    return { a: tintOne(rockA), b: tintOne(rocksB) };
  }, [rockA, rocksB]);

  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);
  const g3 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (g1.current) g1.current.position.y = 9.5 + Math.sin(t * 0.35) * 0.45;
    if (g2.current) g2.current.position.y = 12 + Math.sin(t * 0.28 + 2) * 0.55;
    if (g3.current) g3.current.position.y = 8.2 + Math.sin(t * 0.4 + 4) * 0.4;
  });

  return (
    <group>
      <group ref={g1} position={[12, 9.5, -16]}>
        <primitive object={masters.a.clone()} scale={7} rotation={[0.3, 0.8, 0.1]} />
      </group>
      <group ref={g2} position={[30, 12, -22]}>
        <primitive object={masters.b.clone()} scale={9} rotation={[0.1, 2.2, -0.15]} />
      </group>
      <group ref={g3} position={[46, 8.2, -14]}>
        <primitive object={masters.a.clone()} scale={5.5} rotation={[0.5, 4, 0]} />
      </group>
    </group>
  );
}
