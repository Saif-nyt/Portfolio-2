"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { getDotTexture } from "./fx-textures";
import { homeHeight } from "./home-terrain";
import { CAMPFIRE_SPOTS } from "./home-world";
import { useIsMobile } from "@/lib/hooks";

type Tier = "high" | "low";

interface Swarm {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

function buildSwarm(count: number, quality: Tier): Swarm {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const warm = new THREE.Color("#ffd28a");
  const cool = new THREE.Color("#9af5d8");
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const seed = 611.3 + i * 4.71;
    let x: number;
    let z: number;
    let nearFire = false;

    if (i % 3 !== 2 && CAMPFIRE_SPOTS.length > 0) {
      const fire = CAMPFIRE_SPOTS[i % CAMPFIRE_SPOTS.length];
      const angle = hash01(seed + 1.9) * Math.PI * 2;
      const radius = 1.4 + hash01(seed + 3.1) * 3.8;
      x = fire.position[0] + Math.cos(angle) * radius;
      z = fire.position[2] + Math.sin(angle) * radius;
      nearFire = true;
    } else {
      const angle = hash01(seed + 1.9) * Math.PI * 2;
      const radius = 7 + Math.sqrt(hash01(seed + 3.1)) * 58;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    }

    const ground = homeHeight(x, z);
    positions[i * 3] = x;
    positions[i * 3 + 1] = ground + 0.55 + hash01(seed + 5.3) * (nearFire ? 1.5 : 2.3);
    positions[i * 3 + 2] = z;

    seeds[i] = hash01(seed + 6.7) * 10;
    sizes[i] = (quality === "high" ? 1.1 : 0.9) + hash01(seed + 7.9) * 1.4;
    phases[i] = hash01(seed + 9.1);
    color.copy(nearFire ? warm : cool).lerp(cool, nearFire ? hash01(seed + 10.3) * 0.35 : hash01(seed + 10.3) * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPlayer: { value: new THREE.Vector2(999, 999) },
      uTex: { value: getDotTexture() },
      uOpacity: { value: quality === "high" ? 0.82 : 0.74 },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uPlayer;
      attribute float aSeed;
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec3 p = position;
        float t = uTime;
        float ph = aPhase * 6.2831853;
        p.x += sin(t * 0.36 + aSeed * 1.7) * 0.55;
        p.z += cos(t * 0.29 + aSeed * 1.3) * 0.55;
        p.y += sin(t * 0.62 + ph) * 0.22;
        float blink = 0.5 + 0.5 * sin(t * (0.55 + aPhase * 0.5) + aSeed * 2.1);
        float dist = distance(p.xz, uPlayer);
        float nearFade = smoothstep(64.0, 24.0, dist);
        float cameraFade = smoothstep(0.0, 1.1, dist);
        vAlpha = (0.25 + blink * 0.75) * nearFade * cameraFade;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(aSize * (36.0 / max(-mv.z, 0.6)), 1.0, 5.5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex;
      uniform float uOpacity;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec4 tex = texture2D(uTex, gl_PointCoord);
        float a = tex.a * vAlpha * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  return { geometry, material };
}

export function HomeFireflies({ quality, reduced }: { quality: Tier; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const isMobile = useIsMobile();
  // More of them, and never so faint that they read as sensor noise: the
  // clearing is supposed to feel alive.
  const count = reduced ? 0 : quality === "high" && !isMobile ? 72 : isMobile ? 30 : 40;
  const swarm = useMemo(() => (count > 0 ? buildSwarm(count, quality) : null), [quality, count]);

  useFrame(({ clock, camera }) => {
    if (reduced || !ref.current || !swarm) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uPlayer.value.set(camera.position.x, camera.position.z);
  });

  if (!swarm || reduced) return null;

  return (
    <points
      ref={ref}
      geometry={swarm.geometry}
      material={swarm.material}
      frustumCulled={false}
    />
  );
}
