"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDotTexture } from "@/components/world/arrival/fx-textures";
import { hash01 } from "@/lib/world/anim";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useWorldState } from "@/lib/world/store";
import { useSceneTheme } from "@/lib/world/scene-theme";

interface AmbientMotesProps {
  /** Full-quality particle count (scaled down on the low tier). */
  count?: number;
  color?: string;
  /** Disc radius the motes occupy. */
  radius?: number;
  /** Vertical spread above the floor. */
  height?: number;
  size?: number;
  speed?: number;
}

/**
 * A drifting field of dust motes shared by every location: a single additive
 * point cloud that slowly revolves and bobs, giving an otherwise static room
 * a sense of air. Quality-scaled and frozen under reduced motion.
 */
export function AmbientMotes({
  count = 90,
  color = "#9fe8e0",
  radius = 6,
  height = 5,
  size = 0.14,
  speed = 0.02,
}: AmbientMotesProps) {
  const group = useRef<THREE.Group>(null);
  const { quality } = useWorldState();
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme();
  const moteColor = palette.isLight ? palette.mote : color;

  const total = quality === "high" ? count : Math.max(12, Math.round(count * 0.4));

  const positions = useMemo(() => {
    const array = new Float32Array(total * 3);
    for (let i = 0; i < total; i += 1) {
      const angle = hash01(i * 3 + 1) * Math.PI * 2;
      const r = Math.sqrt(hash01(i * 3 + 2)) * radius;
      array[i * 3] = Math.cos(angle) * r;
      array[i * 3 + 1] = hash01(i * 3 + 3) * height + 0.2;
      array[i * 3 + 2] = Math.sin(angle) * r;
    }
    return array;
  }, [total, radius, height]);

  useFrame((state, delta) => {
    if (reduced) return;
    if (!group.current) return;
    const node = group.current;
    node.rotation.y += delta * speed;
    node.position.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.18;
  });

  const texture = useMemo(() => getDotTexture(), []);

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color={moteColor}
          size={size}
          sizeAttenuation
          transparent
          opacity={palette.isLight ? 0.4 : 0.5}
          depthWrite={false}
          blending={palette.effectBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
