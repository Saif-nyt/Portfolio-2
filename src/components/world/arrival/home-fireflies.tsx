"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { getDotTexture } from "./fx-textures";
import { homeHeight } from "./home-terrain";
import { CAMPFIRE_SPOTS, HOME_PATHS } from "./home-world";
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
  const amber = new THREE.Color("#ffaa55");
  const cyan = new THREE.Color("#63f5e7");
  const emerald = new THREE.Color("#6bffd0");
  const lavender = new THREE.Color("#c5a3ff");
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const seed = 611.3 + i * 4.71;
    let x: number;
    let z: number;
    let category: "campfire" | "path" | "grove" | "ambient";

    const typeRoll = i % 10;
    if (typeRoll < 3 && CAMPFIRE_SPOTS.length > 0) {
      // 30% near campfires & homesteads
      category = "campfire";
      const fire = CAMPFIRE_SPOTS[i % CAMPFIRE_SPOTS.length];
      const angle = hash01(seed + 1.9) * Math.PI * 2;
      const radius = 1.2 + hash01(seed + 3.1) * 3.8;
      x = fire.position[0] + Math.cos(angle) * radius;
      z = fire.position[2] + Math.sin(angle) * radius;
    } else if (typeRoll < 7 && HOME_PATHS.length > 0) {
      // 40% along the walking paths and routes where the visitor actually travels
      category = "path";
      const route = HOME_PATHS[i % HOME_PATHS.length];
      const segIdx = Math.floor(hash01(seed + 1.3) * (route.length - 1));
      const p0 = route[segIdx];
      const p1 = route[Math.min(segIdx + 1, route.length - 1)];
      const t = hash01(seed + 2.7);
      const px = p0[0] + (p1[0] - p0[0]) * t;
      const pz = p0[1] + (p1[1] - p0[1]) * t;
      const dx = p1[0] - p0[0];
      const dz = p1[1] - p0[1];
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      const side = (hash01(seed + 3.8) - 0.5) * 4.2;
      x = px + nx * side;
      z = pz + nz * side;
    } else if (typeRoll < 9) {
      // 20% in groves and foliage clusters
      category = "grove";
      const angle = hash01(seed + 1.9) * Math.PI * 2;
      const radius = 10 + hash01(seed + 3.1) * 32;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius - 8;
    } else {
      // 10% ambient wide scattering across the clearing
      category = "ambient";
      const angle = hash01(seed + 1.9) * Math.PI * 2;
      const radius = 6 + Math.sqrt(hash01(seed + 3.1)) * 54;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    }

    const ground = homeHeight(x, z);
    const floatHeight =
      category === "campfire"
        ? 0.5 + hash01(seed + 5.3) * 1.6
        : category === "path"
          ? 0.75 + hash01(seed + 5.3) * 1.8
          : 0.85 + hash01(seed + 5.3) * 2.4;

    positions[i * 3] = x;
    positions[i * 3 + 1] = ground + floatHeight;
    positions[i * 3 + 2] = z;

    seeds[i] = hash01(seed + 6.7) * 10;
    sizes[i] = (quality === "high" ? 1.25 : 1.0) + hash01(seed + 7.9) * 1.4;
    phases[i] = hash01(seed + 9.1);

    if (category === "campfire") {
      color.copy(warm).lerp(amber, hash01(seed + 10.3) * 0.4);
    } else if (category === "path") {
      color.copy(cyan).lerp(emerald, hash01(seed + 10.3) * 0.5);
    } else if (category === "grove") {
      color.copy(emerald).lerp(lavender, hash01(seed + 10.3) * 0.35);
    } else {
      color.copy(warm).lerp(cyan, hash01(seed + 10.3) * 0.7);
    }

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
      uOpacity: { value: quality === "high" ? 0.9 : 0.82 },
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
        float blink = 0.5 + 0.5 * sin(t * (0.65 + aPhase * 0.6) + aSeed * 2.1);
        float dist = distance(p.xz, uPlayer);
        float nearFade = smoothstep(85.0, 32.0, dist);
        float cameraFade = smoothstep(0.0, 1.0, dist);
        vAlpha = (0.3 + blink * 0.7) * nearFade * cameraFade;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(aSize * (44.0 / max(-mv.z, 0.55)), 1.2, 6.5);
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
  // Plentiful, glowing bioluminescent fireflies scattered along paths,
  // campfires and groves so the frontier clearing feels vibrantly alive.
  const count = reduced ? 0 : quality === "high" && !isMobile ? 240 : isMobile ? 120 : 150;
  const swarm = useMemo(() => (count > 0 ? buildSwarm(count, quality) : null), [quality, count]);

  useEffect(() => {
    if (!swarm) return;
    return () => {
      swarm.geometry.dispose();
      swarm.material.dispose();
    };
  }, [swarm]);

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
