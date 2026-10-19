"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flicker } from "@/lib/world/anim";
import { getSmokeTexture } from "./fx-textures";

interface CabinProps {
  position?: [number, number, number];
  rotationY?: number;
  reduced: boolean;
  quality: "high" | "low";
}

const W = 3.6;
const H = 2.2;
const D = 2.8;
const RH = 1.3;
const OVER = 0.28;

function GableRoof() {
  const geometry = useMemo(() => {
    const hw = W / 2 + OVER;
    const hd = D / 2 + OVER;
    const top = H;
    const ridge = H + RH;
    const v = [
      -hw, top, hd, hw, top, hd, hw, ridge, 0,
      -hw, top, hd, hw, ridge, 0, -hw, ridge, 0,
      hw, top, -hd, -hw, top, -hd, -hw, ridge, 0,
      hw, top, -hd, -hw, ridge, 0, hw, ridge, 0,
      hw, top, -hd, hw, top, hd, hw, ridge, 0,
      -hw, top, hd, -hw, top, -hd, -hw, ridge, 0,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#281c15" roughness={1} metalness={0.02} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Windows({ lit, quality }: { lit: boolean; quality: "high" | "low" }) {
  const warm = useRef<THREE.PointLight>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!lit) return;
    const f = flicker(clock.elapsedTime * 0.7, 21.4);
    if (matRef.current) matRef.current.emissiveIntensity = 2.4 + f * 0.5;
    if (warm.current) warm.current.intensity = 5 + f * 1.5;
  });

  const panes: Array<[number, number, number, [number, number, number]]> = [
    [W / 2 + 0.001, 1.3, 0.55, [0, Math.PI / 2, 0]],
    [W / 2 + 0.001, 1.3, -0.55, [0, Math.PI / 2, 0]],
    [0.7, 1.3, D / 2 + 0.001, [0, 0, 0]],
    [-0.7, 1.3, D / 2 + 0.001, [0, 0, 0]],
  ];

  return (
    <group>
      {panes.map(([x, y, z, rot], i) => (
        <group key={i} position={[x, y, z]} rotation={rot}>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.62, 0.72]} />
            <meshStandardMaterial
              ref={i === 0 ? matRef : undefined}
              color="#3a2410"
              emissive="#ffb066"
              emissiveIntensity={2.4}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.66, 0.06, 0.05]} />
            <meshStandardMaterial color="#221812" roughness={1} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.06, 0.76, 0.05]} />
            <meshStandardMaterial color="#221812" roughness={1} />
          </mesh>
        </group>
      ))}
      <pointLight ref={warm} position={[W / 2 + 0.3, 1.3, 0]} color="#ffab5e" intensity={5} distance={7} decay={2} />
      {quality === "high" ? (
        <pointLight position={[0.7, 1.3, D / 2 + 0.3]} color="#ffab5e" intensity={3.2} distance={6} decay={2} />
      ) : null}
    </group>
  );
}

function ChimneySmoke({ reduced }: { reduced: boolean }) {
  const texture = useMemo(() => getSmokeTexture(), []);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const baseY = H + RH + 0.5;

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < 4; i++) {
      const s = sprites.current[i];
      if (!s) continue;
      const cycle = (t * 0.05 + i / 4) % 1;
      s.position.y = baseY + cycle * 2.2;
      s.position.x = 0.6 + cycle * 0.4;
      const grow = 0.5 + cycle * 1.3;
      s.scale.set(grow, grow, 1);
      (s.material as THREE.SpriteMaterial).opacity = 0.16 * Math.sin(cycle * Math.PI);
    }
  });

  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
          position={[0.6, baseY, 0]}
          scale={[0.5, 0.5, 1]}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} color="#9aa8a4" />
        </sprite>
      ))}
    </group>
  );
}

export function Cabin({ position = [0, 0, 0], rotationY = 0, reduced, quality }: CabinProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#3d2c1f" roughness={0.96} metalness={0.02} />
      </mesh>

      {[
        [-W / 2, 0, -D / 2],
        [W / 2, 0, -D / 2],
        [-W / 2, 0, D / 2],
        [W / 2, 0, D / 2],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], H / 2, p[2]]} castShadow>
          <boxGeometry args={[0.16, H, 0.16]} />
          <meshStandardMaterial color="#241812" roughness={1} />
        </mesh>
      ))}

      <mesh position={[0, H - 0.06, 0]}>
        <boxGeometry args={[W + 0.1, 0.16, D + 0.1]} />
        <meshStandardMaterial color="#241812" roughness={1} />
      </mesh>

      <GableRoof />

      <mesh position={[0.6, H + RH + 0.15, 0.2]} castShadow>
        <boxGeometry args={[0.42, 0.9, 0.42]} />
        <meshStandardMaterial color="#231912" roughness={1} />
      </mesh>

      <group position={[0, 0, D / 2 + 0.001]}>
        <mesh position={[0, 1.02, 0.02]}>
          <boxGeometry args={[0.98, 1.9, 0.1]} />
          <meshStandardMaterial color="#231812" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.02, 0.07]}>
          <boxGeometry args={[0.7, 1.5, 0.02]} />
          <meshStandardMaterial color="#241109" emissive="#ff7a2f" emissiveIntensity={0.7} roughness={0.8} />
        </mesh>
        <mesh position={[0.22, 0.95, 0.09]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ffd9a0" emissive="#ffcf8f" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      <group position={[0, 0, D / 2 + 0.35]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[2.2, 0.1, 0.8]} />
          <meshStandardMaterial color="#251b14" roughness={1} />
        </mesh>
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={i} position={[x, 0.6, 0.3]} castShadow>
            <boxGeometry args={[0.12, 1.2, 0.12]} />
            <meshStandardMaterial color="#221812" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0.7, 1.35, 0.3]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ffd9a0" emissive="#ffbe6b" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
        <pointLight position={[0.7, 1.4, 0.35]} color="#ffc07a" intensity={3.4} distance={5.5} decay={2} />
      </group>

      <pointLight position={[0, 1.15, 0.2]} color="#ffb066" intensity={6.5} distance={11} decay={2} />
      {quality === "high" ? <pointLight position={[0, 1.6, 0]} color="#ff9a4d" intensity={3} distance={7} decay={2} /> : null}

      <Windows lit={!reduced} quality={quality} />
      <ChimneySmoke reduced={reduced} />
    </group>
  );
}
