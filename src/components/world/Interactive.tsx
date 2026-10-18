"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { worldActions, type ActiveObject } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface Hotspot3DProps {
  position: [number, number, number];
  /** Radius of the invisible hit sphere. */
  radius?: number;
  object: ActiveObject;
  accent?: string;
  children?: ReactNode;
  /** Disable interaction (e.g. while a panel is open elsewhere). */
  disabled?: boolean;
  /** Extra idle animation speed multiplier. */
  pulse?: number;
}

/**
 * A clickable 3D hotspot: glowing ring + orb with a generous invisible hit
 * area. Opens the shared holographic panel on click. Keyboard parity is
 * provided by the DOM nav strip and world map.
 */
export function Hotspot3D({
  position,
  radius = 0.7,
  object,
  accent = "#63f5e7",
  children,
  disabled = false,
  pulse = 1,
}: Hotspot3DProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = usePrefersReducedMotion();
  // Stable per-instance phase so a row of hotspots breathes out of sync.
  const phase = useMemo(() => position[0] * 1.7 + position[2] * 0.9, [position]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime * pulse + phase;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      const s = 1 + Math.sin(t * 2) * (hovered ? 0.09 : 0.04);
      ringRef.current.scale.setScalar(s);
    }
    if (orbRef.current) {
      orbRef.current.position.y = 0.15 + Math.sin(t * 1.4) * 0.08;
      const material = orbRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = (hovered ? 2.6 : 1.6) + Math.sin(t * 3) * 0.3;
    }
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (disabled) return;
    event.stopPropagation();
    worldActions.openPanel(object);
  };

  const onOver = (event: ThreeEvent<PointerEvent>) => {
    if (disabled) return;
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const onOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  return (
    <group position={position}>
      {/* Invisible hit target — generous for touch. */}
      <mesh onClick={onClick} onPointerOver={onOver} onPointerOut={onOut} visible={false}>
        <sphereGeometry args={[radius, 12, 12]} />
      </mesh>

      {/* Visible ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <torusGeometry args={[radius * 0.85, 0.035, 8, 36]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={hovered ? 2.4 : 1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Floating orb */}
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[radius * 0.32, 1]} />
        <meshStandardMaterial
          color="#0d2f2a"
          emissive={accent}
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[0, 0.4, 0]} color={accent} intensity={hovered ? 5 : 3} distance={5} decay={2} />
      {children}
    </group>
  );
}

/** Ambient light rig shared by all zones — cheap, no shadow maps by default. */
export function LightRig({
  keyColor = "#cfeee8",
  fillColor = "#63f5e7",
  intensity = 0.9,
}: {
  keyColor?: string;
  fillColor?: string;
  intensity?: number;
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  useFrame(({ camera }) => {
    if (!lightRef.current) return;
    const target = lightRef.current.target;
    target.position.set(camera.position.x, 0, 0);
    target.updateMatrixWorld();
    lightRef.current.position.set(camera.position.x - 4, 9, 5);
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#9fd8d2" />
      <hemisphereLight args={["#0d3330", "#050f0d", 0.45]} />
      <directionalLight ref={lightRef} position={[-4, 9, 5]} intensity={intensity} color={keyColor} />
      <directionalLight position={[8, 3, -6]} intensity={0.16} color={fillColor} />
    </>
  );
}

export interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

/** Simple camera state machine: lerp between named poses. */
export function CameraDirector({
  pose,
  poses,
  reduced = false,
}: {
  pose: string;
  poses: Record<string, CameraPose>;
  reduced?: boolean;
}) {
  const { camera } = useThree();
  const prefersReduced = usePrefersReducedMotion();
  const isReduced = reduced || prefersReduced;
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, delta) => {
    const config = poses[pose] ?? poses[Object.keys(poses)[0]];
    if (!config) return;
    targetPos.set(config.position[0], config.position[1], config.position[2]);
    targetLook.set(config.lookAt[0], config.lookAt[1], config.lookAt[2]);
    const dt = Math.min(delta, 0.05);
    if (isReduced) {
      camera.position.copy(targetPos);
      currentLook.copy(targetLook);
    } else {
      camera.position.lerp(targetPos, 1 - Math.exp(-dt * 2.8));
      currentLook.lerp(targetLook, 1 - Math.exp(-dt * 2.8));
    }
    camera.lookAt(currentLook);
  });

  return null;
}
