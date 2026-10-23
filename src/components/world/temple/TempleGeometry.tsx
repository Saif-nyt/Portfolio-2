"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { hash01 } from "@/lib/world/anim";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { requestWorldFrame } from "@/lib/world/render-loop";

/**
 * Procedural stone-temple architecture. No external GLBs — geometry is built
 * in-code so the zone loads instantly and stays under a few KB of JS.
 *
 * The shapes here are the original temple proportions; every surface is now
 * theme-aware, so the same architecture reads as wet bioluminescent stone at
 * night and sunlit limestone by day instead of staying permanently midnight.
 */

type StoneTone = "base" | "dark" | "light";

/** Theme-aware stone. Keeps the original silhouettes; only the colour reacts. */
export function StoneMaterial({
  tone = "base",
  /** 0–1 weathering mix toward the crevice tone; varies per block. */
  weather = 0,
  roughness = 0.94,
  emissive,
  emissiveIntensity = 0,
  metalness = 0.05,
  flatShading = false,
}: {
  tone?: StoneTone;
  weather?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  flatShading?: boolean;
}) {
  const palette = useSceneTheme();
  const base = tone === "dark" ? palette.stoneDark : tone === "light" ? palette.stoneLight : palette.stone;
  const color = weather > 0 ? mixHex(base, palette.stoneDark, Math.min(0.5, weather * 0.5)) : base;
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      roughness={roughness}
      metalness={metalness}
      flatShading={flatShading}
    />
  );
}

/** Soft radial contact shadow used to ground objects on the floor. */
export function GroundShadow({
  position,
  size = 1.4,
  opacity = 0.32,
  rotation = [-Math.PI / 2, 0, 0],
}: {
  position: [number, number, number];
  size?: number;
  opacity?: number;
  rotation?: [number, number, number];
}) {
  const palette = useSceneTheme();
  return (
    <mesh rotation={rotation} position={position}>
      <circleGeometry args={[size, 20]} />
      <meshBasicMaterial
        color={palette.isLight ? "#5a5342" : "#000000"}
        transparent
        opacity={palette.isLight ? opacity * 1.1 : opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * A weathered stone pillar: tapered shaft on a stepped base, with a glowing
 * capital. Original proportions preserved; colour is theme-driven.
 */
export function Pillar({
  position,
  height = 3.2,
  accent = "#8fd8ff",
  variant = 0,
}: {
  position: [number, number, number];
  height?: number;
  accent?: string;
  variant?: number;
}) {
  const palette = useSceneTheme();
  const weather = hash01(variant * 3.7 + 1.1);
  const capGlow = palette.accent(accent);
  return (
    <group position={position}>
      {/* Shaft */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.3, height, 8]} />
        <StoneMaterial tone="base" weather={weather} roughness={0.97} />
      </mesh>
      {/* Stepped base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.2, 0.72]} />
        <StoneMaterial tone="dark" weather={weather} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.86, 0.08, 0.86]} />
        <StoneMaterial tone="dark" weather={weather * 0.5} />
      </mesh>
      {/* Glowing capital */}
      <mesh position={[0, height + 0.12, 0]} castShadow>
        <boxGeometry args={[0.55, 0.24, 0.55]} />
        <meshStandardMaterial
          color={mixHex(palette.stoneDark, palette.stone, 0.4)}
          emissive={capGlow}
          emissiveIntensity={0.9 * palette.glow}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0, height + 0.3, 0]}
        color={accent}
        intensity={palette.isLight ? 0.8 : 1.6}
        distance={4}
        decay={2}
      />
    </group>
  );
}

/** Weathered rubble scattered around the approach — one instanced mesh. */
export function Rubble({ origin = [0, 0, 0], count = 12, spread = 5 }: { origin?: [number, number, number]; count?: number; spread?: number }) {
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const palette = useSceneTheme();
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.stoneDark,
        roughness: 1,
        metalness: 0.02,
        flatShading: true,
      }),
    [palette.stoneDark],
  );
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const a = hash01(i * 4.1 + 2) * Math.PI * 2;
      const r = 1.5 + hash01(i * 5.3 + 9) * spread;
      dummy.position.set(origin[0] + Math.cos(a) * r, 0.05 + hash01(i * 7.7) * 0.08, origin[2] + Math.sin(a) * r);
      dummy.rotation.set(hash01(i * 2.1) * 3, hash01(i * 3.3) * 3, hash01(i * 4.5) * 3);
      const s = 0.08 + hash01(i * 6.1) * 0.16;
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, origin, spread]);

  // Imperative geometry/material are not auto-disposed by R3F; the material
  // also changes with the theme palette, so each swap must release the old one.
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow receiveShadow />;
}

/**
 * The grand doorway: two jambs, a lintel and a carved cornice, a glowing
 * threshold arch, and doors that swing open. The interior reads as depth
 * (a lit recess), never as a black void.
 */
export function TempleDoor({
  open,
  snap = false,
  accent = "#8fd8ff",
  onOpened,
}: {
  open: boolean;
  /** Skip/watchdog recovery: snap both leaves fully open in one frame. */
  snap?: boolean;
  accent?: string;
  /**
   * Fires once, the first time both leaves pass ~86% of their swing — real
   * doorway clearance rather than a timer, so the camera never walks into a
   * leaf that is still closing. Mirrors `TempleEntrance`'s event.
   */
  onOpened?: () => void;
}) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const recessRef = useRef<THREE.MeshStandardMaterial>(null);
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme();
  const glow = palette.accent(accent);
  const openedRef = useRef(false);
  const onOpenedRef = useRef(onOpened);
  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);
  const springRef = useRef({
    elapsed: 0,
    leftVelocity: 0,
    rightVelocity: 0,
    open,
  });
  useEffect(() => {
    requestWorldFrame();
  }, [open, snap]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const instant = reduced || snap;
    const spring = springRef.current;
    const changed = spring.open !== open;
    if (changed) {
      spring.open = open;
      spring.elapsed = 0;
    } else {
      spring.elapsed += dt;
    }

    const openingAngle = Math.PI * 0.43;
    // Right leaf starts on a delay (skipped under reduced motion / snap so
    // both leaves open together).
    const rightStarted = open && (instant || spring.elapsed > 0.16);
    const leftTarget = open ? openingAngle : 0;
    const rightTarget = rightStarted ? -openingAngle : 0;
    const recessTarget = open ? 0 : 1;
    const left = leftRef.current;
    const right = rightRef.current;
    const recess = recessRef.current;

    // Clearance event, not a timer: both leaves must be past ~86% of their
    // travel before the camera is allowed to move through the doorway. Runs
    // before the rest check so a door that snaps open (reduced motion) or is
    // already parked open still reports clearance.
    if (!open) {
      openedRef.current = false;
    } else if (
      !openedRef.current &&
      left &&
      right &&
      left.rotation.y > openingAngle * 0.86 &&
      right.rotation.y < -openingAngle * 0.86
    ) {
      openedRef.current = true;
      onOpenedRef.current?.();
    }

    // The delayed right leaf must block rest: otherwise the demand loop falls
    // asleep between the two leaves and the right one never opens at all.
    const rightPending = open && !instant && spring.elapsed < 0.16;
    const atRest =
      !changed &&
      !rightPending &&
      left &&
      right &&
      Math.abs(left.rotation.y - leftTarget) < 0.0015 &&
      Math.abs(right.rotation.y - rightTarget) < 0.0015 &&
      Math.abs(spring.leftVelocity) < 0.001 &&
      Math.abs(spring.rightVelocity) < 0.001 &&
      (!recess || Math.abs(recess.opacity - recessTarget) < 0.004);
    if (atRest) return;

    const updateHinge = (
      hinge: THREE.Group | null,
      velocity: "leftVelocity" | "rightVelocity",
      target: number,
    ) => {
      if (!hinge) return;
      if (instant) {
        hinge.rotation.y = target;
        spring[velocity] = 0;
        return;
      }
      const displacement = target - hinge.rotation.y;
      spring[velocity] += displacement * 23 * dt;
      spring[velocity] *= Math.exp(-8.5 * dt);
      hinge.rotation.y += spring[velocity] * dt;
      if (Math.abs(displacement) < 0.001 && Math.abs(spring[velocity]) < 0.001) {
        hinge.rotation.y = target;
        spring[velocity] = 0;
      }
    };
    updateHinge(leftRef.current, "leftVelocity", open ? openingAngle : 0);
    updateHinge(
      rightRef.current,
      "rightVelocity",
      open && (instant || spring.elapsed > 0.16) ? -openingAngle : 0,
    );
    if (recessRef.current) {
      const opacity = open ? 0 : 1;
      recessRef.current.opacity = instant
        ? opacity
        : THREE.MathUtils.damp(recessRef.current.opacity, opacity, 2.1, dt);
    }

    requestWorldFrame();
  });

  return (
    <group>
      {/* Recessed inner chamber — a lit stone alcove so the opening has depth */}
      <mesh position={[0, 1.8, -0.55]}>
        <boxGeometry args={[2.5, 3.7, 0.08]} />
        <meshStandardMaterial
          ref={recessRef}
          color={palette.isLight ? mixHex(palette.stoneDark, "#3a3528", 0.5) : mixHex(palette.stoneDark, palette.floorDeep, 0.4)}
          transparent
          opacity={1}
          depthWrite={false}
          roughness={1}
        />
      </mesh>
      {/* Left jamb */}
      <mesh position={[-1.35, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 3.6, 0.6]} />
        <StoneMaterial tone="dark" weather={0.3} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[1.35, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 3.6, 0.6]} />
        <StoneMaterial tone="dark" weather={0.45} />
      </mesh>
      {/* Lintel */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <boxGeometry args={[3.4, 0.55, 0.7]} />
        <StoneMaterial tone="base" weather={0.2} />
      </mesh>
      {/* Carved cornice above the lintel */}
      <mesh position={[0, 4.28, 0.02]} castShadow>
        <boxGeometry args={[3.8, 0.3, 0.78]} />
        <StoneMaterial tone="light" weather={0.1} />
      </mesh>
      {/* Glowing threshold arch */}
      <mesh position={[0, 3.5, 0.06]}>
        <torusGeometry args={[1.1, 0.06, 8, 24, Math.PI]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.6 * palette.glow} toneMapped={false} />
      </mesh>

      {/* Left door leaf — hinged on the left jamb */}
      <group ref={leftRef} position={[-1.1, 0, 0]}>
        <mesh position={[0.55, 1.7, 0]} castShadow>
          <boxGeometry args={[1.1, 3.4, 0.18]} />
          <meshStandardMaterial
            color={mixHex(palette.stoneDark, palette.stoneLight, 0.48)}
            emissive={palette.isLight ? "#241c10" : "#143b36"}
            emissiveIntensity={palette.isLight ? 0.08 : 0.42}
            roughness={0.78}
            metalness={0.18}
            flatShading
          />
        </mesh>
        <mesh position={[0.55, 1.7, 0.12]}>
          <boxGeometry args={[0.78, 2.65, 0.04]} />
          <meshStandardMaterial color={mixHex(palette.stoneDark, palette.stoneLight, 0.34)} roughness={0.84} metalness={0.1} />
        </mesh>
        <mesh position={[0.06, 1.7, 0.15]}>
          <boxGeometry args={[0.06, 3.05, 0.04]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.32 * palette.glow} toneMapped={false} />
        </mesh>
        {/* rune inlay */}
        <mesh position={[0.55, 1.9, 0.08]}>
          <ringGeometry args={[0.18, 0.24, 6]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.2 * palette.glow} toneMapped={false} />
        </mesh>
      </group>

      {/* Right door leaf — hinged on the right jamb */}
      <group ref={rightRef} position={[1.1, 0, 0]}>
        <mesh position={[-0.55, 1.7, 0]} castShadow>
          <boxGeometry args={[1.1, 3.4, 0.18]} />
          <meshStandardMaterial
            color={mixHex(palette.stoneDark, palette.stoneLight, 0.48)}
            emissive={palette.isLight ? "#241c10" : "#143b36"}
            emissiveIntensity={palette.isLight ? 0.08 : 0.42}
            roughness={0.78}
            metalness={0.18}
            flatShading
          />
        </mesh>
        <mesh position={[-0.55, 1.7, 0.12]}>
          <boxGeometry args={[0.78, 2.65, 0.04]} />
          <meshStandardMaterial color={mixHex(palette.stoneDark, palette.stoneLight, 0.34)} roughness={0.84} metalness={0.1} />
        </mesh>
        <mesh position={[-0.06, 1.7, 0.15]}>
          <boxGeometry args={[0.06, 3.05, 0.04]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.32 * palette.glow} toneMapped={false} />
        </mesh>
        <mesh position={[-0.55, 1.9, 0.08]}>
          <ringGeometry args={[0.18, 0.24, 6]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.2 * palette.glow} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** A flight of broad steps rising to the threshold. */
export function TempleSteps({ z = 1.6 }: { z?: number }) {
  return (
    <group position={[0, 0, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.07 + i * 0.13, -i * 0.42]} castShadow receiveShadow>
          <boxGeometry args={[4.4 - i * 0.3, 0.16, 0.9]} />
          <StoneMaterial tone={i % 2 === 0 ? "base" : "light"} weather={0.15 + i * 0.08} />
        </mesh>
      ))}
    </group>
  );
}

/** Carved relief panels set into the back wall — a single instanced mesh. */
export function CarvedReliefs({ z = -6.72, y = 2.4, count = 7 }: { z?: number; y?: number; count?: number }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const palette = useSceneTheme();
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.stoneLight,
        roughness: 0.92,
        metalness: 0.03,
        flatShading: true,
      }),
    [palette.stoneLight],
  );
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const x = (i - (count - 1) / 2) * 1.7;
      dummy.position.set(x, y, z);
      dummy.scale.set(1.15, 1.4 + hash01(i * 2.3) * 0.3, 0.12);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, y, z]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <instancedMesh ref={ref} args={[geometry, material, count]} receiveShadow />;
}

/** Floor with a subtle glowing path strip. */
export function TempleFloor({ width = 14, depth = 16 }: { width?: number; depth?: number }) {
  const palette = useSceneTheme();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={palette.floor} roughness={0.95} metalness={0.02} />
      </mesh>
      {/* Central path glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.6, depth * 0.9]} />
        <meshStandardMaterial
          color={palette.floorDeep}
          emissive={palette.accent("#8fd8ff")}
          emissiveIntensity={0.55 * palette.glow}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Chamber enclosure. The great doorway sits at z=0: everything behind it
 * (z<0) is interior; the approach (z>0) is open air. Side walls and the
 * ceiling therefore cover only the interior half, and a front facade wraps
 * the doorway so the entrance reads as a real threshold rather than a
 * freestanding gate inside a three-sided box.
 */
export function TempleWalls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.5, -7]} castShadow receiveShadow>
        <boxGeometry args={[14, 5, 0.5]} />
        <StoneMaterial tone="dark" weather={0.35} />
      </mesh>
      {/* Left interior wall — stops at the doorway plane */}
      <mesh position={[-7, 2.5, -3.5]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 5, 7.5]} />
        <StoneMaterial tone="dark" weather={0.5} />
      </mesh>
      {/* Right interior wall — stops at the doorway plane */}
      <mesh position={[7, 2.5, -3.5]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 5, 7.5]} />
        <StoneMaterial tone="dark" weather={0.25} />
      </mesh>
      {/* Front facade flanking the great doorway */}
      <mesh position={[-4.35, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.3, 5, 0.5]} />
        <StoneMaterial tone="dark" weather={0.4} />
      </mesh>
      <mesh position={[4.35, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.3, 5, 0.5]} />
        <StoneMaterial tone="dark" weather={0.3} />
      </mesh>
      {/* Facade cornice bridging over the doorway */}
      <mesh position={[0, 4.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.6, 0.6]} />
        <StoneMaterial tone="light" weather={0.18} />
      </mesh>
      {/* Ceiling over the interior only */}
      <mesh position={[0, 5.1, -3.5]}>
        <boxGeometry args={[14.2, 0.3, 7.8]} />
        <StoneMaterial tone="dark" weather={0.2} />
      </mesh>
    </group>
  );
}

/** Slowly rotating holographic ring used as archive centerpiece. */
export function HoloRing({
  position,
  radius = 0.8,
  color = "#8fd8ff",
  speed = 0.4,
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const palette = useSceneTheme();
  const glow = palette.accent(color);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.6;
      ref.current.rotation.y += delta * speed;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, 0.03, 8, 40]} />
      <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.6 * palette.glow} roughness={0.4} />
    </mesh>
  );
}

/** Floating glyph shards that orbit a point — decorative, cheap. */
export function GlyphOrbit({
  center,
  count = 6,
  radius = 1.4,
  color = "#8fd8ff",
}: {
  center: [number, number, number];
  count?: number;
  radius?: number;
  color?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const palette = useSceneTheme();
  const glow = palette.accent(color);
  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return {
          key: i,
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: Math.sin(i * 1.7) * 0.3,
          scale: 0.08 + (i % 3) * 0.03,
        };
      }),
    [count, radius],
  );

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={groupRef} position={center}>
      {shards.map((shard) => (
        <mesh key={shard.key} position={[shard.x, shard.y, shard.z]} rotation={[shard.key, shard.key * 0.5, 0]}>
          <octahedronGeometry args={[shard.scale, 0]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.5 * palette.glow} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
