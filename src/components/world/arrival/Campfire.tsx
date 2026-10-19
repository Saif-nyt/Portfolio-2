"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flicker, hash01, wobble } from "@/lib/world/anim";
import { getDotTexture, getFlameTexture, getSmokeTexture } from "./fx-textures";

type Tier = "high" | "low";

interface CampfireProps {
  position?: [number, number, number];
  quality: Tier;
  reduced: boolean;
  scale?: number;
}

const LOG_MAT = { color: "#2a1c12", roughness: 0.95, metalness: 0.02 } as const;
const STONE_MAT = { color: "#26302d", roughness: 0.9, metalness: 0.05 } as const;

function CampfireLight({ reduced, scale }: { reduced: boolean; scale: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    const f = flicker(t, 3.7);
    const g = flicker(t * 1.9, 11.3);
    if (lightRef.current) {
      lightRef.current.intensity = (6 + f * 4) * scale;
      lightRef.current.position.x = wobble(t * 1.6, 4.2) * 0.05;
      lightRef.current.position.z = wobble(t * 1.3, 8.9) * 0.05;
      lightRef.current.position.y = 0.55 + f * 0.07;
    }
    if (shadowMat.current) shadowMat.current.opacity = 0.22 + g * 0.1;
    if (shadowRef.current) {
      const s = 1 + (f - 0.5) * 0.16;
      shadowRef.current.scale.setScalar(s);
    }
  });

  return (
    <>
      <pointLight ref={lightRef} position={[0, 0.55, 0]} color="#ff8a3c" intensity={7 * scale} distance={10 * scale} decay={2} />
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.5 * scale, 24]} />
        <meshBasicMaterial ref={shadowMat} color="#020705" transparent opacity={0.24} depthWrite={false} />
      </mesh>
    </>
  );
}

function Stones({ scale, quality }: { scale: number; quality: Tier }) {
  const count = quality === "high" ? 11 : 8;
  const transforms = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + 0.3;
      return {
        pos: [Math.cos(a) * 1.05 * scale, 0.13 * scale, Math.sin(a) * 1.05 * scale] as [number, number, number],
        rot: [hash01(i * 3.1) * 3, hash01(i * 5.7) * 3, hash01(i * 7.3) * 3] as [number, number, number],
        scl: 0.26 + hash01(i * 2.3) * 0.16,
      };
    });
  }, [count, scale]);

  return (
    <group>
      {transforms.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={t.rot} scale={t.scl} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial {...STONE_MAT} />
        </mesh>
      ))}
    </group>
  );
}

function Logs({ scale }: { scale: number }) {
  const logs = useMemo(() => {
    return [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return {
        pos: [Math.cos(a) * 0.22 * scale, 0.16 * scale, Math.sin(a) * 0.22 * scale] as [number, number, number],
        rot: [0, a, 1.32] as [number, number, number],
      };
    });
  }, [scale]);

  return (
    <group>
      {logs.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={l.rot} castShadow>
          <cylinderGeometry args={[0.11 * scale, 0.11 * scale, 1.3 * scale, 7]} />
          <meshStandardMaterial {...LOG_MAT} />
        </mesh>
      ))}
      <mesh position={[0, 0.12 * scale, 0]}>
        <sphereGeometry args={[0.28 * scale, 10, 8]} />
        <meshStandardMaterial color="#3a1a0a" emissive="#ff5a1e" emissiveIntensity={1.4} roughness={0.85} toneMapped={false} />
      </mesh>
    </group>
  );
}

interface FlameLayer {
  color: string;
  y: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  seed: number;
  speed: number;
  yJitter: number;
  curl: number;
}

function Flames({ reduced, scale, quality }: { reduced: boolean; scale: number; quality: Tier }) {
  const texture = useMemo(() => getFlameTexture(), []);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);

  const layers = useMemo<FlameLayer[]>(() => {
    const base: FlameLayer[] = [
      { color: "#fff6d8", y: 0.3, scaleX: 0.3, scaleY: 0.62, opacity: 0.9, seed: 0.6, speed: 2.3, yJitter: 0.07, curl: 0.03 },
      { color: "#ffc46b", y: 0.44, scaleX: 0.38, scaleY: 0.9, opacity: 0.6, seed: 2.1, speed: 1.9, yJitter: 0.09, curl: 0.05 },
      { color: "#ff8f3f", y: 0.6, scaleX: 0.32, scaleY: 1.12, opacity: 0.46, seed: 4.4, speed: 1.6, yJitter: 0.12, curl: 0.07 },
      { color: "#ff6a24", y: 0.76, scaleX: 0.24, scaleY: 1.28, opacity: 0.3, seed: 6.8, speed: 1.35, yJitter: 0.16, curl: 0.09 },
      { color: "#ff4d1a", y: 0.9, scaleX: 0.16, scaleY: 1.34, opacity: 0.2, seed: 9.2, speed: 1.15, yJitter: 0.2, curl: 0.11 },
    ];
    return quality === "high" ? base : base.slice(0, 3);
  }, [quality]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < layers.length; i++) {
      const l = layers[i];
      const s = sprites.current[i];
      if (!s) continue;
      const f = flicker(t * l.speed, l.seed);
      const slow = wobble(t * l.speed * 0.6, l.seed + 1.3);
      s.position.y = (l.y + f * l.yJitter) * scale;
      s.position.x = wobble(t * l.speed, l.seed + 2.7) * l.curl * scale;
      s.position.z = wobble(t * l.speed * 0.8, l.seed + 5.1) * l.curl * 0.6 * scale;
      s.scale.set(l.scaleX * scale * (0.95 + (1 - f) * 0.12), l.scaleY * scale * (0.7 + f * 0.55), 1);
      const mat = s.material as THREE.SpriteMaterial;
      mat.opacity = l.opacity * (0.55 + f * 0.5);
      mat.rotation = slow * 0.35;
    }
  });

  return (
    <group>
      {layers.map((l, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
          position={[0, l.y * scale, 0]}
          scale={[l.scaleX * scale, l.scaleY * scale, 1]}
        >
          <spriteMaterial
            map={texture}
            color={l.color}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={l.opacity}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

function Embers({ reduced, scale, quality }: { reduced: boolean; scale: number; quality: Tier }) {
  const texture = useMemo(() => getDotTexture(), []);
  const count = quality === "high" ? 46 : 18;
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifes = new Float32Array(count);
    const vel = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const s = i * 7.13 + 1.5;
      seeds[i] = s;
      sizes[i] = 3 + hash01(s + 9) * 5;
      lifes[i] = hash01(s + 3.3);
      positions[i * 3] = (hash01(s + 1) - 0.5) * 0.3;
      positions[i * 3 + 1] = 0.1 + hash01(s + 4) * 0.6;
      positions[i * 3 + 2] = (hash01(s + 2) - 0.5) * 0.3;
      vel[i * 3] = (hash01(s + 5) - 0.5) * 0.14;
      vel[i * 3 + 1] = 0.45 + hash01(s + 6) * 0.7;
      vel[i * 3 + 2] = (hash01(s + 7) - 0.5) * 0.14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aLife", new THREE.BufferAttribute(lifes, 1));
    g.userData.ember = { positions, lifes, vel, seeds };
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: texture }, uColor: { value: new THREE.Color("#ffb24d") } },
        vertexShader: `
          attribute float aSize;
          attribute float aLife;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (34.0 / max(-mv.z, 0.1));
            vAlpha = smoothstep(0.0, 0.12, aLife) * (1.0 - smoothstep(0.55, 1.0, aLife));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex;
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec4 t = texture2D(uTex, gl_PointCoord);
            gl_FragColor = vec4(uColor, 1.0) * t * vAlpha;
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [texture],
  );

  useFrame((_, delta) => {
    if (reduced) return;
    const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined;
    const data = geo?.userData.ember as { positions: Float32Array; lifes: Float32Array; vel: Float32Array; seeds: Float32Array } | undefined;
    if (!geo || !data) return;
    const dt = Math.min(delta, 0.05);
    const { positions, lifes, vel, seeds } = data;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      lifes[i] += dt * 0.26;
      if (lifes[i] >= 1) {
        lifes[i] = 0;
        seeds[i] += 1;
        positions[i3] = (hash01(seeds[i] + 13) - 0.5) * 0.28;
        positions[i3 + 1] = 0.08;
        positions[i3 + 2] = (hash01(seeds[i] + 100) - 0.5) * 0.28;
        vel[i3] = (hash01(seeds[i] + 200) - 0.5) * 0.16;
        vel[i3 + 1] = 0.45 + hash01(seeds[i] + 300) * 0.75;
        vel[i3 + 2] = (hash01(seeds[i] + 400) - 0.5) * 0.16;
      } else {
        positions[i3] += vel[i3] * dt * scale;
        positions[i3 + 1] += vel[i3 + 1] * dt * scale;
        positions[i3 + 2] += vel[i3 + 2] * dt * scale;
        vel[i3] += Math.sin(lifes[i] * 9 + seeds[i]) * dt * 0.25;
        vel[i3 + 2] += Math.cos(lifes[i] * 7 + seeds[i]) * dt * 0.25;
      }
    }
    geo.attributes.position.needsUpdate = true;
    (geo.attributes.aLife as THREE.BufferAttribute).needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

interface SmokePuff {
  y: number;
  size: number;
  opacity: number;
  seed: number;
  speed: number;
  drift: number;
}

function Smoke({ reduced, scale, quality }: { reduced: boolean; scale: number; quality: Tier }) {
  const texture = useMemo(() => getSmokeTexture(), []);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const puffs = useMemo<SmokePuff[]>(() => {
    const n = quality === "high" ? 6 : 4;
    return Array.from({ length: n }, (_, i) => ({
      y: 0.9 + (i / n) * 2.4,
      size: 0.9 + (i / n) * 1.6,
      opacity: 0.28 * (1 - (i / n) * 0.7),
      seed: i * 3.7 + 1.1,
      speed: 1.1 + hash01(i) * 0.5,
      drift: 0.3,
    }));
  }, [quality]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      const s = sprites.current[i];
      if (!s) continue;
      const cycle = (t * 0.06 * p.speed + i / puffs.length) % 1;
      s.position.y = (p.y + cycle * 2.6) * scale;
      s.position.x = (wobble(t * 0.4 * p.speed, p.seed) * p.drift + cycle * 0.5) * scale;
      s.position.z = wobble(t * 0.3 * p.speed, p.seed + 3) * p.drift * scale;
      const grow = p.size * (0.6 + cycle * 1.4) * scale;
      s.scale.set(grow, grow, 1);
      const mat = s.material as THREE.SpriteMaterial;
      mat.opacity = p.opacity * Math.sin(cycle * Math.PI);
      mat.rotation = cycle * 0.8 * (i % 2 === 0 ? 1 : -1);
    }
  });

  return (
    <group>
      {puffs.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
          position={[0, p.y * scale, 0]}
          scale={[p.size * scale, p.size * scale, 1]}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={p.opacity} color="#8fa09c" />
        </sprite>
      ))}
    </group>
  );
}

export function Campfire({ position = [0, 0, 0], quality, reduced, scale = 1 }: CampfireProps) {
  return (
    <group position={position}>
      <CampfireLight reduced={reduced} scale={scale} />
      <Stones scale={scale} quality={quality} />
      <Logs scale={scale} />
      <Flames reduced={reduced} scale={scale} quality={quality} />
      <Embers reduced={reduced} scale={scale} quality={quality} />
      <Smoke reduced={reduced} scale={scale} quality={quality} />
    </group>
  );
}
