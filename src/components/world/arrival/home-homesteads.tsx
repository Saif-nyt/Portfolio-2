"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flicker } from "@/lib/world/anim";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { getSmokeTexture } from "./fx-textures";
import { HOMESTEADS, type Homestead } from "./home-world";

const W = 4.4;
const H = 2.35;
const D = 3.5;
const RIDGE = 1.35;

function Smoke({ reduced }: { reduced: boolean }) {
  const texture = useMemo(() => getSmokeTexture(), []);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < 3; i += 1) {
      const sprite = sprites.current[i];
      if (!sprite) continue;
      const cycle = (t * 0.045 + i / 3) % 1;
      sprite.position.y = 4.35 + cycle * 2.1;
      sprite.position.x = -1.3 + cycle * 0.5;
      const grow = 0.4 + cycle * 1.15;
      sprite.scale.set(grow, grow, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = 0.13 * Math.sin(cycle * Math.PI);
    }
  });

  return (
    <group>
      {[0, 1, 2].map((i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
          position={[-1.3, 4.35, 0]}
          scale={[0.4, 0.4, 1]}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} color="#9aa8a4" />
        </sprite>
      ))}
    </group>
  );
}

function HomesteadHouse({ home, reduced }: { home: Homestead; reduced: boolean }) {
  const palette = useSceneTheme();
  const stone = mixHex(palette.stoneDark, palette.stone, 0.36);
  const wood = mixHex("#3d2c1f", palette.stoneDark, 0.22);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useMemo(() => getSmokeTexture(), []);
  const roofAngle = Math.atan2(RIDGE, W / 2);
  const roofLength = Math.hypot(W / 2, RIDGE);
  const gable = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo(W / 2, 0);
    shape.lineTo(0, RIDGE + 0.06);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useFrame(({ clock }) => {
    if (!glow.current) return;
    const f = flicker(clock.elapsedTime * 0.8, 12.7);
    glow.current.emissiveIntensity = 1.35 + f * 0.45;
  });

  return (
    <group position={home.position} rotation={[0, home.rotation, 0]} scale={home.scale}>
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.4, 0.4, D + 0.4]} />
        <meshStandardMaterial color={stone} roughness={1} flatShading />
      </mesh>

      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={wood} roughness={0.96} />
      </mesh>

      {[
        [-W / 2, -D / 2],
        [W / 2, -D / 2],
        [-W / 2, D / 2],
        [W / 2, D / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.42, z]} castShadow>
          <boxGeometry args={[0.16, 2.55, 0.16]} />
          <meshStandardMaterial color="#241812" roughness={1} />
        </mesh>
      ))}

      <mesh position={[-W / 4, 3.05, 0]} rotation={[0, 0, roofAngle]} castShadow>
        <boxGeometry args={[roofLength, 0.14, D + 0.75]} />
        <meshStandardMaterial color={mixHex("#4a3a2f", palette.stone, 0.28)} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[W / 4, 3.05, 0]} rotation={[0, 0, -roofAngle]} castShadow>
        <boxGeometry args={[roofLength, 0.14, D + 0.75]} />
        <meshStandardMaterial color={mixHex("#4a3a2f", palette.stone, 0.28)} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.86, 0]}>
        <boxGeometry args={[0.18, 0.12, D + 0.8]} />
        <meshStandardMaterial color="#5a4636" roughness={1} />
      </mesh>
      <mesh geometry={gable} position={[0, 2.45, D / 2 + 0.02]}>
        <meshStandardMaterial color={mixHex("#4a362a", palette.stone, 0.22)} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={gable} position={[0, 2.45, -D / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={mixHex("#4a362a", palette.stone, 0.22)} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {[-W / 2 - 0.03, W / 2 + 0.03].map((x, i) => (
        <mesh key={`eave-${i}`} position={[x, 2.45, 0]}>
          <boxGeometry args={[0.1, 0.14, D + 0.8]} />
          <meshStandardMaterial color="#5a4636" roughness={1} />
        </mesh>
      ))}

      <mesh position={[-1.25, 3.45, -0.55]} castShadow>
        <boxGeometry args={[0.52, 1.5, 0.52]} />
        <meshStandardMaterial color={stone} roughness={1} flatShading />
      </mesh>

      <group position={[0, 0, D / 2 + 0.01]}>
        <mesh position={[0, 1.02, 0.01]}>
          <boxGeometry args={[1.02, 1.92, 0.08]} />
          <meshStandardMaterial color="#231812" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.0, 0.06]}>
          <boxGeometry args={[0.74, 1.58, 0.03]} />
          <meshStandardMaterial color="#241109" emissive="#ff7a2f" emissiveIntensity={0.65} roughness={0.85} />
        </mesh>
        <mesh position={[0.26, 0.92, 0.09]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#ffd9a0" emissive="#ffcf8f" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {[-1.35, 1.35].map((x, i) => (
          <group key={i} position={[x, 1.45, 0.02]}>
            <mesh>
              <planeGeometry args={[0.68, 0.78]} />
              <meshStandardMaterial
                ref={i === 0 ? glow : undefined}
                color="#3a2410"
                emissive="#ffb066"
                emissiveIntensity={1.35}
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.74, 0.06, 0.05]} />
              <meshStandardMaterial color="#221812" roughness={1} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.06, 0.84, 0.05]} />
              <meshStandardMaterial color="#221812" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>

      <sprite position={[0, 1.25, 2.35]} scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={halo}
          color="#ffb066"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      <group position={[0, 0, D / 2 + 0.48]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[2.5, 0.12, 1.0]} />
          <meshStandardMaterial color="#251b14" roughness={1} />
        </mesh>
        {[-1.05, 1.05].map((x, i) => (
          <mesh key={i} position={[x, 0.66, 0.34]} castShadow>
            <boxGeometry args={[0.12, 1.3, 0.12]} />
            <meshStandardMaterial color="#221812" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, 1.32, 0.32]} castShadow>
          <boxGeometry args={[2.7, 0.1, 1.15]} />
          <meshStandardMaterial color="#241812" roughness={1} />
        </mesh>
        <mesh position={[0.82, 1.12, 0.32]}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshStandardMaterial color="#ffd9a0" emissive="#ffbe6b" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      <group position={[0, 0, D / 2 + 1.55]}>
        {[-3.0, -1.7, 1.7, 3.0].map((x, i) => (
          <mesh key={i} position={[x, 0.45, 0]} castShadow>
            <boxGeometry args={[0.12, 0.9, 0.12]} />
            <meshStandardMaterial color="#241a12" roughness={1} />
          </mesh>
        ))}
        {[-2.35, 2.35].map((x, i) => (
          <mesh key={`rail-${i}`} position={[x, 0.62, 0]}>
            <boxGeometry args={[1.42, 0.07, 0.07]} />
            <meshStandardMaterial color="#2a1d14" roughness={1} />
          </mesh>
        ))}
      </group>

      <mesh position={[W / 2 + 0.01, 1.45, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.72]} />
        <meshStandardMaterial color="#3a2410" emissive="#ff9d55" emissiveIntensity={0.9} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      <Smoke reduced={reduced} />
    </group>
  );
}

export function HomeHomesteads({ reduced }: { reduced: boolean }) {
  return (
    <group>
      {HOMESTEADS.map((home) => (
        <HomesteadHouse key={`${home.position[0]}-${home.position[2]}`} home={home} reduced={reduced} />
      ))}
    </group>
  );
}
