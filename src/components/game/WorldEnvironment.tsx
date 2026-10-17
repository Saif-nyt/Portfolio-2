"use client";

import { Environment } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Deterministic PRNG so scenery is stable across renders (compiler purity). */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
}

/**
 * World foundation: fog, night-sky lighting (Poly Haven HDRI via drei),
 * a textured terrain corridor, distant mountain silhouettes, moonlight that
 * follows the explorer, and drifting spore particles.
 */
export function WorldEnvironment({
  reduced,
  shadows,
  sporeCount,
}: {
  reduced: boolean;
  shadows: boolean;
  sporeCount: number;
}) {
  const moonRef = useRef<THREE.DirectionalLight>(null);
  useFrame(({ camera }) => {
    if (!moonRef.current) return;
    const target = moonRef.current.target;
    target.position.set(camera.position.x, 0, 0);
    target.updateMatrixWorld();
    moonRef.current.position.set(camera.position.x - 7, 13, 6);
  });

  // Distant mountain silhouettes.
  const mountains = useMemo(() => {
    const rand = seededRandom(0xabc123);
    return Array.from({ length: 14 }, (_, i) => ({
      x: i * 4.4 + rand() * 2,
      height: 6 + rand() * 9,
      radius: 4 + rand() * 4,
      z: -26 - rand() * 12,
    }));
  }, []);

  // Spores: a small points cloud drifting upward.
  const sporesRef = useRef<THREE.Points>(null);
  const sporeGeo = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sporeCount * 3);
    const rand = seededRandom(0x5f0e11);
    for (let i = 0; i < sporeCount; i += 1) {
      positions[i * 3] = rand() * 56;
      positions[i * 3 + 1] = rand() * 6;
      positions[i * 3 + 2] = (rand() - 0.5) * 12;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [sporeCount]);

  useFrame((_, delta) => {
    if (reduced || !sporesRef.current) return;
    const positions = sporesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < sporeCount; i += 1) {
      let y = positions.getY(i) + dt * (0.12 + (i % 5) * 0.02);
      if (y > 6.5) y = 0;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  });

  return (
    <group>
      <ambientLight intensity={0.45} color="#9fd8d2" />
      <hemisphereLight args={["#0d3330", "#050f0d", 0.5]} />
      <directionalLight
        ref={moonRef}
        position={[-7, 13, 6]}
        intensity={0.85}
        color="#cfeee8"
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />
      {/* A soft cyan fill from the bioluminescent ground cover. */}
      <directionalLight position={[10, 4, -8]} intensity={0.18} color="#63f5e7" />

      <Terrain />

      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, -1, m.z]}>
          <coneGeometry args={[m.radius, m.height, 5]} />
          <meshStandardMaterial color="#081a17" roughness={1} fog />
        </mesh>
      ))}

      <points ref={sporesRef} geometry={sporeGeo}>
        <pointsMaterial
          size={0.05}
          color="#8ff5ea"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* HDRI used for reflections/light only — background colour set above. */}
      <Environment files="/environments/night_sky_1k.hdr" background={false} frames={1} />
    </group>
  );
}

/** Textured ground corridor with gentle undulation off the main path. */
function Terrain() {
  const [diffuse, normal] = useLoader(THREE.TextureLoader, [
    "/textures/ground_diffuse.jpg",
    "/textures/ground_normal.jpg",
  ]);

  const geometry = useMemo(() => {
    const width = 60;
    const depth = 18;
    const geo = new THREE.PlaneGeometry(width, depth, 96, 24);
    const positions = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      // Flatten a corridor near z=0; undulate away from the path.
      const edge = Math.max(0, Math.abs(y) - 3.2);
      const lift = Math.min(edge * 0.35, 2.2);
      const noise = Math.sin(x * 0.55) * Math.cos(y * 0.8) * 0.18 * Math.min(edge, 1.5);
      positions.setZ(i, lift + noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const map = useMemo(() => {
    const texture = diffuse.clone();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [diffuse]);

  const normalMap = useMemo(() => {
    const texture = normal.clone();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 4);
    return texture;
  }, [normal]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[28, 0, 0]} receiveShadow>
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.7, 0.7)}
        roughness={0.92}
        metalness={0.02}
        color="#9fb8ae"
      />
    </mesh>
  );
}
