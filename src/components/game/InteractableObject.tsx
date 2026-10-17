"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Zone } from "@/data/zones";
import { worldBridge, zoneToWorldX } from "@/components/game/world-bridge";

interface ZoneModelProps {
  zone: Zone;
  children?: ReactNode;
  /** Fallback procedural pedestal when no GLB is provided. */
  showPad?: boolean;
}

/**
 * A clickable 3D zone landmark: loads the KayKit structure for the zone,
 * highlights on hover, plays a slow energy-ring pulse, and reports clicks
 * through the shared worldBridge (which routes into the mission system).
 */
export function ZoneModel({ zone, children, showPad = false }: ZoneModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hoverRef = useRef(false);

  const x = zoneToWorldX(zone.x);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime;
    const near = worldBridge.nearZoneId === zone.id;

    // Gentle idle rotation on the energy ring.
    if (ringRef.current && !worldBridge.reducedMotion) {
      ringRef.current.rotation.z += delta * (near ? 0.9 : 0.35);
      const scale = 1 + Math.sin(t * 2.2) * (near ? 0.06 : 0.025);
      ringRef.current.scale.setScalar(scale);
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = (near ? 2.2 : 1.1) + Math.sin(t * 3) * 0.25;
    }

    // Hover/near emphasis via subtle lift.
    const targetY = hoverRef.current || near ? 0.12 : 0;
    group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 8, delta);
  });

  const onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hoverRef.current = true;
    document.body.style.cursor = "pointer";
  };
  const onPointerOut = () => {
    hoverRef.current = false;
    document.body.style.cursor = "";
  };
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    worldBridge.onActivateZone(zone);
  };

  return (
    <group
      ref={groupRef}
      position={[x, 0, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Energy ring marking the interactable. */}
      <mesh ref={ringRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.045, 10, 48]} />
        <meshStandardMaterial
          color="#63f5e7"
          emissive="#63f5e7"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {showPad ? (
        /* Cylinder geometry already lies flat along Y — no rotation. */
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[1.35, 1.5, 0.06, 24]} />
          <meshStandardMaterial color="#12312b" roughness={0.85} />
        </mesh>
      ) : null}
      {children}
    </group>
  );
}

/** KayKit structure wrapper: loads a GLTF and optionally tints it. */
export function KitStructure({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  tint = "#123a34",
  tintAmount = 0.35,
}: {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tint?: string;
  tintAmount?: number;
}) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    const target = new THREE.Color(tint);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Preserve single-vs-array shape: an array material on a geometry
        // without draw groups renders nothing.
        const wasArray = Array.isArray(child.material);
        const originals: THREE.Material[] = wasArray ? child.material : [child.material];
        const mapped = originals.map((original: THREE.Material) => {
          const material = original.clone() as THREE.MeshStandardMaterial;
          if (material.color) material.color.lerp(target, tintAmount);
          return material;
        });
        child.material = wasArray ? (mapped as THREE.Material[]) : mapped[0];
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, tint, tintAmount]);

  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

/** Procedural crystal cluster for the Skill Constellation zone. */
export function CrystalCluster({ zone }: { zone: Zone }) {
  const groupRef = useRef<THREE.Group>(null);
  const crystal0 = useRef<THREE.Mesh>(null);
  const crystal1 = useRef<THREE.Mesh>(null);
  const crystal2 = useRef<THREE.Mesh>(null);
  const crystal3 = useRef<THREE.Mesh>(null);
  const crystal4 = useRef<THREE.Mesh>(null);
  const crystalRefs = [crystal0, crystal1, crystal2, crystal3, crystal4];

  useFrame(({ clock }) => {
    if (worldBridge.reducedMotion) return;
    const t = clock.elapsedTime;
    crystalRefs.forEach((ref, index) => {
      if (!ref.current) return;
      ref.current.position.y = 1.1 + index * 0.28 + Math.sin(t * (0.7 + index * 0.13)) * 0.14;
      ref.current.rotation.y += 0.004 + index * 0.001;
    });
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    }
  });

  return (
    <ZoneModel zone={zone}>
      <group ref={groupRef}>
        {[
          [0, 1.1, 0, 0.34],
          [0.55, 1.3, 0.3, 0.24],
          [-0.5, 1.45, -0.2, 0.28],
          [0.2, 1.6, -0.5, 0.2],
          [-0.25, 1.25, 0.5, 0.22],
        ].map(([px, py, pz, size], index) => (
          <mesh
            key={index}
            ref={crystalRefs[index]}
            position={[px as number, py as number, pz as number]}
            rotation={[0.2 * index, index, 0.1]}
          >
            <octahedronGeometry args={[size as number, 0]} />
            <meshStandardMaterial
              color="#0f4a42"
              emissive="#63f5e7"
              emissiveIntensity={1.5}
              roughness={0.2}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </ZoneModel>
  );
}

/** Spinning portal ring for the Landing Zone. */
export function PortalRing({ zone }: { zone: Zone }) {
  const innerRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!innerRef.current || worldBridge.reducedMotion) return;
    innerRef.current.rotation.y += delta * 0.6;
  });
  return (
    <ZoneModel zone={zone} showPad>
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[1.05, 0.09, 12, 40]} />
        <meshStandardMaterial color="#1a5a50" emissive="#37d6c5" emissiveIntensity={1.1} />
      </mesh>
      <mesh ref={innerRef} position={[0, 1.5, 0]}>
        <torusGeometry args={[0.72, 0.045, 10, 32]} />
        <meshStandardMaterial color="#63f5e7" emissive="#63f5e7" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color="#63f5e7" intensity={4} distance={6} decay={2} />
    </ZoneModel>
  );
}

useGLTF.preload("/models/kaykit/basemodule_A.gltf");
useGLTF.preload("/models/kaykit/basemodule_D.gltf");
useGLTF.preload("/models/kaykit/drill_structure.gltf");
useGLTF.preload("/models/kaykit/cargodepot_A.gltf");
useGLTF.preload("/models/kaykit/containers_A.gltf");
useGLTF.preload("/models/kaykit/cargo_B_stacked.gltf");
useGLTF.preload("/models/kaykit/lander_A.gltf");
useGLTF.preload("/models/kaykit/landingpad_small.gltf");
useGLTF.preload("/models/kaykit/lights.gltf");
useGLTF.preload("/models/kaykit/rocks_A.gltf");
useGLTF.preload("/models/kaykit/rock_B.gltf");
