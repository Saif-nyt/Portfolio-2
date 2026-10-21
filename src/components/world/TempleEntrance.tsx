"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { Pillar, StoneMaterial } from "@/components/world/temple/TempleGeometry";
import { requestWorldFrame } from "@/lib/world/render-loop";

/**
 * Reusable ceremonial temple entrance.
 *
 * A physically-grounded gateway — threshold pad, steps, flanking columns,
 * layered jambs, a lintel/cornice and a pediment — framing a recessed doorway
 * with real depth, a glowing energy seal and doors that swing open. Every
 * destination drops one of these into its own environment and themes it with
 * its accent, so the entrances read as one architectural family without being
 * identical copies.
 *
 * The seal fades and the leaves part when `open` flips true. The destination
 * name and the "Enter" prompt live in the location HUD (DOM), which keeps the
 * 3D scene asset-light.
 */
export interface TempleEntranceProps {
  position?: [number, number, number];
  rotationY?: number;
  accent?: string;
  open: boolean;
  /** Clear opening width. */
  width?: number;
  /** Clear opening height. */
  height?: number;
  /** Scale the whole gateway (columns, jamb, pediment) uniformly. */
  scale?: number;
  /**
   * Fired once when both leaves have reached clearance. The Home cinematic
   * uses this instead of a timeout so the camera can never fly through a
   * half-open door.
   */
  onOpened?: () => void;
}

export function TempleEntrance({
  position = [0, 0, 0],
  rotationY = 0,
  accent = "#8fd8ff",
  open,
  width = 2.2,
  height = 3.4,
  scale = 1,
  onOpened,
}: TempleEntranceProps) {
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme();
  const glow = palette.accent(accent);
  const halfW = width / 2;

  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const sealRef = useRef<THREE.MeshBasicMaterial>(null);
  const springRef = useRef({
    elapsed: 0,
    leftVelocity: 0,
    rightVelocity: 0,
    open,
  });
  const openedRef = useRef(false);
  const onOpenedRef = useRef(onOpened);
  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);
  useEffect(() => {
    requestWorldFrame();
  }, [open]);
  const pediment = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfW - 1.05, 0);
    shape.lineTo(0, 1.65);
    shape.lineTo(halfW + 1.05, 0);
    shape.closePath();
    return shape;
  }, [halfW]);

  useFrame((_, delta) => {
    const spring = springRef.current;
    if (spring.open !== open) {
      spring.open = open;
      spring.elapsed = 0;
    }

    const openingAngle = Math.PI * 0.43;
    const leftTarget = open ? openingAngle : 0;
    const rightTarget = open && spring.elapsed > 0.28 ? -openingAngle : 0;
    const sealTarget = open ? 0 : 0.72;
    const left = leftRef.current;
    const right = rightRef.current;
    const seal = sealRef.current;

    // Doors at rest should cost nothing per frame (the demand loop already
    // sleeps when idle; this also keeps always-on walk mode nearly free).
    const atRest =
      left &&
      right &&
      Math.abs(left.rotation.y - leftTarget) < 0.0015 &&
      Math.abs(right.rotation.y - rightTarget) < 0.0015 &&
      Math.abs(spring.leftVelocity) < 0.001 &&
      Math.abs(spring.rightVelocity) < 0.001 &&
      (!seal || Math.abs(seal.opacity - sealTarget) < 0.004);
    if (atRest) return;

    const updateHinge = (
      hinge: THREE.Group | null,
      velocity: "leftVelocity" | "rightVelocity",
      target: number,
      dt: number,
    ) => {
      if (!hinge) return;
      if (reduced) {
        hinge.rotation.y = target;
        spring[velocity] = 0;
        return;
      }
      // Heavier spring: large stone leaves accelerate slowly, drift through a
      // short overshoot and settle — no snappy, mechanical snap.
      const displacement = target - hinge.rotation.y;
      spring[velocity] += displacement * 9.5 * dt;
      spring[velocity] *= Math.exp(-5.2 * dt);
      hinge.rotation.y += spring[velocity] * dt;
      if (Math.abs(displacement) < 0.001 && Math.abs(spring[velocity]) < 0.001) {
        hinge.rotation.y = target;
        spring[velocity] = 0;
      }
    };

    // Integrate in fixed substeps so a slow device (or a backgrounded tab)
    // cannot stretch the gate animation into a 30-second wait. The clamp keeps
    // a long stall from running hundreds of iterations at once.
    const total = Math.min(delta, 0.5);
    let remaining = total;
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 60);
      remaining -= step;
      spring.elapsed += step;
      if (leftRef.current) {
        updateHinge(leftRef.current, "leftVelocity", open ? openingAngle : 0, step);
      }
      if (rightRef.current) {
        const rightTarget = open && spring.elapsed > 0.28 ? -openingAngle : 0;
        updateHinge(rightRef.current, "rightVelocity", rightTarget, step);
      }
    }

    if (sealRef.current) {
      const opacity = open ? 0 : 0.72;
      sealRef.current.opacity = reduced
        ? opacity
        : THREE.MathUtils.damp(sealRef.current.opacity, opacity, 1.7, Math.min(delta, 0.25));
    }

    // Clearance event, not a timer: both leaves must be past ~86% of their
    // travel before the cinematic is allowed to move the camera through.
    if (!open) {
      openedRef.current = false;
    } else if (
      !openedRef.current &&
      leftRef.current &&
      rightRef.current &&
      leftRef.current.rotation.y > openingAngle * 0.86 &&
      rightRef.current.rotation.y < -openingAngle * 0.86
    ) {
      openedRef.current = true;
      onOpenedRef.current?.();
    }

    // Follow the transition through to rest even on the demand loop.
    requestWorldFrame();
  });

  const leafColor = mixHex(palette.stoneDark, palette.stoneLight, palette.isLight ? 0.32 : 0.52);
  const trimColor = palette.isLight ? "#8c7550" : "#79a99c";
  const doorEmissive = palette.isLight ? "#241c10" : "#143b36";

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Threshold pad + steps rising to the opening */}
      <mesh position={[0, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[halfW * 2 + 2.6, 2.4]} />
        <meshStandardMaterial color={palette.floor} roughness={0.96} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.06 + i * 0.12, 1.1 - i * 0.4]} castShadow receiveShadow>
          <boxGeometry args={[halfW * 2 + 2 - i * 0.35, 0.14, 0.8]} />
          <StoneMaterial tone={i % 2 === 0 ? "base" : "light"} weather={0.12 + i * 0.08} />
        </mesh>
      ))}

      {/* Flanking columns */}
      <Pillar position={[-(halfW + 0.85), 0, 0.2]} height={height + 0.5} accent={accent} variant={11} />
      <Pillar position={[halfW + 0.85, 0, 0.2]} height={height + 0.5} accent={accent} variant={12} />

      {/* Recessed doorway sides and ceiling add depth without blocking the view through. */}
      <mesh position={[-halfW - 0.12, height / 2, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height, 1.1]} />
        <StoneMaterial tone="dark" weather={0.3} />
      </mesh>
      <mesh position={[halfW + 0.12, height / 2, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[0.24, height, 1.1]} />
        <StoneMaterial tone="dark" weather={0.3} />
      </mesh>
      <mesh position={[0, height + 0.12, -0.55]}>
        <boxGeometry args={[width + 0.5, 0.24, 1.1]} />
        <StoneMaterial tone="dark" weather={0.2} />
      </mesh>
      {/* Layered jambs framing the opening */}
      <mesh position={[-halfW - 0.3, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, height + 0.2, 0.56]} />
        <StoneMaterial tone="dark" weather={0.42} />
      </mesh>
      <mesh position={[halfW + 0.3, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, height + 0.2, 0.56]} />
        <StoneMaterial tone="dark" weather={0.28} />
      </mesh>
      <mesh position={[-halfW - 0.3, height / 2, 0.31]} castShadow>
        <boxGeometry args={[0.1, height + 0.34, 0.08]} />
        <meshStandardMaterial color={trimColor} emissive={glow} emissiveIntensity={0.38 * palette.glow} roughness={0.72} metalness={0.32} />
      </mesh>
      <mesh position={[halfW + 0.3, height / 2, 0.31]} castShadow>
        <boxGeometry args={[0.1, height + 0.34, 0.08]} />
        <meshStandardMaterial color={trimColor} emissive={glow} emissiveIntensity={0.38 * palette.glow} roughness={0.72} metalness={0.32} />
      </mesh>

      {/* Lintel + carved cornice */}
      <mesh position={[0, height + 0.35, 0]} castShadow>
        <boxGeometry args={[width + 1.3, 0.42, 0.64]} />
        <StoneMaterial tone="base" weather={0.18} />
      </mesh>
      <mesh position={[0, height + 0.68, 0.02]} castShadow>
        <boxGeometry args={[width + 1.7, 0.26, 0.72]} />
        <StoneMaterial tone="light" weather={0.1} />
      </mesh>

      {/* Carved triangular crown gives the entry a readable silhouette. */}
      <mesh position={[0, height + 0.8, -0.24]} castShadow receiveShadow>
        <extrudeGeometry args={[pediment, { depth: 0.42, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.08, bevelThickness: 0.06 }]} />
        <StoneMaterial tone="light" weather={0.15} flatShading />
      </mesh>
      <mesh position={[0, height + 1.86, 0.04]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.7 * palette.glow} metalness={0.28} roughness={0.28} toneMapped={false} />
      </mesh>

      {/* Energy seal across the opening (fades as the gate opens) */}
      <mesh position={[0, height / 2, 0.04]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={sealRef}
          color={glow}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={palette.effectBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Glowing threshold arch */}
      <mesh position={[0, height - 0.05, 0.06]}>
        <torusGeometry args={[halfW - 0.05, 0.05, 8, 24, Math.PI]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.5 * palette.glow} toneMapped={false} />
      </mesh>

      {/* Doors — hinged on the outer jambs */}
      <group ref={leftRef} position={[-halfW, 0, 0]}>
        <mesh position={[halfW / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[halfW, height, 0.18]} />
          <meshStandardMaterial color={leafColor} emissive={doorEmissive} emissiveIntensity={palette.isLight ? 0.08 : 0.42} roughness={0.78} metalness={0.18} flatShading />
        </mesh>
        <mesh position={[halfW / 2, height / 2, 0.1]}>
          <boxGeometry args={[halfW * 0.74, height * 0.72, 0.045]} />
          <meshStandardMaterial color={mixHex(leafColor, palette.stoneLight, 0.18)} roughness={0.88} metalness={0.08} flatShading />
        </mesh>
        <mesh position={[halfW / 2, height / 2, 0.13]}>
          <boxGeometry args={[halfW * 0.58, height * 0.56, 0.025]} />
          <meshStandardMaterial color={leafColor} roughness={0.9} metalness={0.08} />
        </mesh>
        {[0.12, halfW - 0.12].map((x) => (
          <mesh key={x} position={[x, height / 2, 0.15]}>
            <boxGeometry args={[0.07, height * 0.88, 0.035]} />
            <meshStandardMaterial color={trimColor} emissive={glow} emissiveIntensity={0.28 * palette.glow} roughness={0.52} metalness={0.48} />
          </mesh>
        ))}
        {[height * 0.08, height * 0.92].map((y) => (
          <mesh key={y} position={[halfW / 2, y, 0.15]}>
            <boxGeometry args={[halfW * 0.86, 0.07, 0.035]} />
            <meshStandardMaterial color={trimColor} roughness={0.52} metalness={0.48} />
          </mesh>
        ))}
        <mesh position={[halfW / 2, height * 0.62, 0.07]}>
          <ringGeometry args={[0.15, 0.2, 6]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.1 * palette.glow} toneMapped={false} />
        </mesh>
        {[height * 0.24, height * 0.76].map((y) => (
          <mesh key={y} position={[0.07, y, 0.13]}>
            <cylinderGeometry args={[0.075, 0.075, 0.18, 8]} />
            <meshStandardMaterial color={trimColor} roughness={0.45} metalness={0.62} />
          </mesh>
        ))}
      </group>
      <group ref={rightRef} position={[halfW, 0, 0]}>
        <mesh position={[-halfW / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[halfW, height, 0.18]} />
          <meshStandardMaterial color={leafColor} emissive={doorEmissive} emissiveIntensity={palette.isLight ? 0.08 : 0.42} roughness={0.78} metalness={0.18} flatShading />
        </mesh>
        <mesh position={[-halfW / 2, height / 2, 0.1]}>
          <boxGeometry args={[halfW * 0.74, height * 0.72, 0.045]} />
          <meshStandardMaterial color={mixHex(leafColor, palette.stoneLight, 0.18)} roughness={0.88} metalness={0.08} flatShading />
        </mesh>
        <mesh position={[-halfW / 2, height / 2, 0.13]}>
          <boxGeometry args={[halfW * 0.58, height * 0.56, 0.025]} />
          <meshStandardMaterial color={leafColor} roughness={0.9} metalness={0.08} />
        </mesh>
        {[-0.12, -(halfW - 0.12)].map((x) => (
          <mesh key={x} position={[x, height / 2, 0.15]}>
            <boxGeometry args={[0.07, height * 0.88, 0.035]} />
            <meshStandardMaterial color={trimColor} emissive={glow} emissiveIntensity={0.28 * palette.glow} roughness={0.52} metalness={0.48} />
          </mesh>
        ))}
        {[height * 0.08, height * 0.92].map((y) => (
          <mesh key={y} position={[-halfW / 2, y, 0.15]}>
            <boxGeometry args={[halfW * 0.86, 0.07, 0.035]} />
            <meshStandardMaterial color={trimColor} roughness={0.52} metalness={0.48} />
          </mesh>
        ))}
        <mesh position={[-halfW / 2, height * 0.62, 0.07]}>
          <ringGeometry args={[0.15, 0.2, 6]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.1 * palette.glow} toneMapped={false} />
        </mesh>
        {[height * 0.24, height * 0.76].map((y) => (
          <mesh key={y} position={[-0.07, y, 0.13]}>
            <cylinderGeometry args={[0.075, 0.075, 0.18, 8]} />
            <meshStandardMaterial color={trimColor} roughness={0.45} metalness={0.62} />
          </mesh>
        ))}
      </group>

      {/* Warm light pulling the eye to the doorway */}
      <pointLight
        position={[0, height * 0.7, 0.9]}
        color={accent}
        intensity={palette.isLight ? 3 : 6}
        distance={10}
        decay={2}
      />
    </group>
  );
}
