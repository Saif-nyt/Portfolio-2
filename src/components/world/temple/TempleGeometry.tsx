"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural stone-temple architecture. No external GLBs — geometry is built
 * in-code so the zone loads instantly and stays under a few KB of JS.
 */

export function StoneMaterial({
  color = "#243b35",
  emissive = "#163834",
  emissiveIntensity = 0.35,
  roughness = 0.92,
}: {
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      roughness={roughness}
      metalness={0.05}
    />
  );
}

/** A weathered stone pillar with a glowing capital. */
export function Pillar({
  position,
  height = 3.2,
  accent = "#8fd8ff",
}: {
  position: [number, number, number];
  height?: number;
  accent?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, height, 8]} />
        <StoneMaterial color="#274039" />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <StoneMaterial color="#1f322d" />
      </mesh>
      {/* Glowing capital */}
      <mesh position={[0, height + 0.12, 0]}>
        <boxGeometry args={[0.55, 0.24, 0.55]} />
        <meshStandardMaterial
          color="#0f2a26"
          emissive={accent}
          emissiveIntensity={0.9}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, height + 0.25, 0]} color={accent} intensity={1.6} distance={4} decay={2} />
    </group>
  );
}

/** The grand doorway: two jambs, a lintel, and doors that swing open. */
export function TempleDoor({
  open,
  accent = "#8fd8ff",
}: {
  open: boolean;
  accent?: string;
}) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const target = open ? Math.PI * 0.42 : 0;
    const dt = Math.min(delta, 0.05);
    if (leftRef.current) {
      leftRef.current.rotation.y = THREE.MathUtils.damp(leftRef.current.rotation.y, -target, 3.5, dt);
    }
    if (rightRef.current) {
      rightRef.current.rotation.y = THREE.MathUtils.damp(rightRef.current.rotation.y, target, 3.5, dt);
    }
  });

  return (
    <group>
      {/* Left jamb */}
      <mesh position={[-1.35, 1.8, 0]} castShadow>
        <boxGeometry args={[0.5, 3.6, 0.6]} />
        <StoneMaterial color="#22362f" />
      </mesh>
      {/* Right jamb */}
      <mesh position={[1.35, 1.8, 0]} castShadow>
        <boxGeometry args={[0.5, 3.6, 0.6]} />
        <StoneMaterial color="#22362f" />
      </mesh>
      {/* Lintel */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <boxGeometry args={[3.4, 0.55, 0.7]} />
        <StoneMaterial color="#1d2f29" />
      </mesh>
      {/* Glowing threshold arch */}
      <mesh position={[0, 3.5, 0.05]}>
        <torusGeometry args={[1.1, 0.06, 8, 24, Math.PI]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Left door leaf — hinged on the left jamb */}
      <group ref={leftRef} position={[-1.1, 0, 0]}>
        <mesh position={[0.55, 1.7, 0]} castShadow>
          <boxGeometry args={[1.1, 3.4, 0.12]} />
          <meshStandardMaterial color="#182a25" roughness={0.85} metalness={0.15} />
        </mesh>
        {/* rune inlay */}
        <mesh position={[0.55, 1.9, 0.08]}>
          <ringGeometry args={[0.18, 0.24, 6]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Right door leaf — hinged on the right jamb */}
      <group ref={rightRef} position={[1.1, 0, 0]}>
        <mesh position={[-0.55, 1.7, 0]} castShadow>
          <boxGeometry args={[1.1, 3.4, 0.12]} />
          <meshStandardMaterial color="#182a25" roughness={0.85} metalness={0.15} />
        </mesh>
        <mesh position={[-0.55, 1.9, 0.08]}>
          <ringGeometry args={[0.18, 0.24, 6]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Floor with a subtle glowing path strip. */
export function TempleFloor({ width = 14, depth = 16 }: { width?: number; depth?: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#152723"
          emissive="#123a33"
          emissiveIntensity={0.3}
          roughness={0.95}
        />
      </mesh>
      {/* Central path glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.6, depth * 0.9]} />
        <meshStandardMaterial
          color="#0e2c28"
          emissive="#8fd8ff"
          emissiveIntensity={0.7}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

/** Back wall with alcoves for the archive chambers. */
export function TempleWalls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.5, -7]} castShadow receiveShadow>
        <boxGeometry args={[14, 5, 0.5]} />
        <StoneMaterial color="#1b2e29" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-7, 2.5, 0]} castShadow>
        <boxGeometry args={[0.5, 5, 14]} />
        <StoneMaterial color="#182925" />
      </mesh>
      {/* Right wall */}
      <mesh position={[7, 2.5, 0]} castShadow>
        <boxGeometry args={[0.5, 5, 14]} />
        <StoneMaterial color="#182925" />
      </mesh>
      {/* Ceiling beam suggestion */}
      <mesh position={[0, 5.1, 0]}>
        <boxGeometry args={[14.2, 0.3, 14.2]} />
        <StoneMaterial color="#132421" />
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
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.6;
      ref.current.rotation.y += delta * speed;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, 0.03, 8, 40]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
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
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
