"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getDotTexture } from "@/components/world/arrival/fx-textures";
import { hash01 } from "@/lib/world/anim";
import { useSceneTheme } from "@/lib/world/scene-theme";

interface GalaxySkyProps {
  quality: "high" | "low";
  reduced: boolean;
}

/**
 * A deep-space sky rendered as a huge camera-locked sphere. The sphere never
 * reveals an edge or a seam: it is larger than the camera's far plane from
 * every reachable position and its shader is authored in direction space, so
 * there is no gradient that reads as a painted ceiling. Stars are a separate
 * point cloud for crisp sub-pixel highlights; faint galactic structure and
 * atmospheric haze are procedural and cost one fragment shader pass.
 *
 * The star shell sits at STAR_RADIUS — beyond every piece of world geometry
 * (the terrain tops out at ~310) but inside the sky sphere — so depth testing
 * against the world silhouettes them against mountains instead of letting
 * transparent sorting paint them over the ground.
 */
const STAR_RADIUS = 430;
/** `pointsMaterial` size for STAR_RADIUS, tuned to match the 260-radius look. */
const STAR_SIZE = 2.23;

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = /* glsl */ `
varying vec3 vDir;
uniform float uLow;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec3 d = normalize(vDir);
  float height = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);

  // Midnight zenith fading to a cold, hazy atmosphere at the local horizon.
  vec3 zenith = vec3(0.003, 0.005, 0.016);
  vec3 middle = vec3(0.006, 0.018, 0.042);
  vec3 horizon = vec3(0.010, 0.040, 0.070);
  vec3 color = mix(horizon, middle, smoothstep(0.44, 0.64, height));
  color = mix(color, zenith, smoothstep(0.62, 1.0, height));

  // A narrow, very faint teal haze — atmospheric depth, not a dome band.
  float haze = exp(-pow((d.y + 0.01) * 16.0, 2.0));
  color += vec3(0.015, 0.055, 0.065) * haze * 0.55;

  // Below the local horizon the sphere reads as ground haze, not open space:
  // past the edge of the terrain the visitor must never see a starfield where
  // the ground should be.
  color = mix(vec3(0.006, 0.014, 0.020), color, smoothstep(-0.18, 0.0, d.y));

  // Flat, equirectangular star grid: stable in direction space so camera
  // rotation never makes stars crawl or re-roll.
  vec2 sphere = vec2(
    atan(d.z, d.x) / 6.2831853 + 0.5,
    asin(clamp(d.y, -1.0, 1.0)) / 3.1415926 + 0.5
  );

  vec2 gridA = sphere * vec2(260.0, 130.0);
  vec2 cellA = floor(gridA);
  vec2 fA = fract(gridA);
  float seedA = hash21(cellA);
  vec2 offsetA = vec2(hash21(cellA + 7.1), hash21(cellA + 11.7));
  float starA = smoothstep(0.055, 0.0, length(fA - offsetA)) * step(0.958, seedA) * 0.86;

  float star = starA * 0.85;
  vec3 starColor = mix(vec3(0.65, 0.82, 0.90), vec3(1.0, 0.94, 0.82), seedA);
  // No stars (and no galactic band) below the horizon — that is ground.
  float above = smoothstep(-0.02, 0.07, d.y);

  if (uLow < 0.5) {
    vec2 gridB = sphere * vec2(120.0, 60.0);
    vec2 cellB = floor(gridB);
    vec2 fB = fract(gridB);
    float seedB = hash21(cellB + 19.3);
    vec2 offsetB = vec2(hash21(cellB + 3.3), hash21(cellB + 29.1));
    float starB = smoothstep(0.085, 0.0, length(fB - offsetB)) * step(0.988, seedB);
    star += starB * 0.55;

    // Restrained galactic band crossing the sky diagonally. This noise is the
    // expensive half of the shader, so the low tier keeps the gradient and
    // stars but skips the nebula entirely.
    float band = exp(-pow(abs(dot(d, normalize(vec3(0.18, 0.72, 0.67)))), 2.0) * 20.0);
    float cloud = noise(sphere * vec2(8.0, 4.0) + 3.4);
    cloud = cloud * 0.6 + noise(sphere * vec2(18.0, 9.0)) * 0.3;
    vec3 nebulaColor = mix(vec3(0.008, 0.035, 0.060), vec3(0.020, 0.100, 0.120), cloud);
    color += nebulaColor * band * 0.42 * above;
  }

  color += starColor * star * above;

  // Dither out 8-bit banding in the very dark gradient.
  color += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}
`;

function makeStarField(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const palette = ["#d6e4dc", "#a9c5c7", "#7dabb2", "#d6b28c", "#ecede0"];

  for (let i = 0; i < count; i += 1) {
    // Stars live only above the local horizon: a uniform sample over the
    // upper hemisphere (equal area per y-band), never under the ground.
    const y = 0.03 + hash01(i * 4 + 1) * 0.97;
    const angle = hash01(i * 4 + 2) * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const distance = radius * (0.9 + hash01(i * 4 + 3) * 0.1);
    positions[i * 3] = Math.cos(angle) * ring * distance;
    positions[i * 3 + 1] = y * distance;
    positions[i * 3 + 2] = Math.sin(angle) * ring * distance;

    color.set(palette[Math.floor(hash01(i * 4 + 4) * palette.length)]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  return { positions, colors };
}

export function GalaxySky({ quality, reduced }: GalaxySkyProps) {
  const sky = useRef<THREE.Group>(null);
  const palette = useSceneTheme();
  const count = quality === "high" ? 2600 : 900;
  const stars = useMemo(() => makeStarField(count, STAR_RADIUS), [count]);
  const texture = useMemo(() => getDotTexture(), []);
  const uniforms = useMemo(
    () => ({ uLow: { value: quality === "low" ? 1 : 0 } }),
    [quality],
  );

  useFrame(({ camera }, delta) => {
    if (!sky.current) return;
    sky.current.position.copy(camera.position);
    if (!reduced) sky.current.rotation.y += delta * 0.00035;
  });

  // The daylight theme is a separate, intentional palette — a pale sky is
  // supplied by the scene clear colour instead of forcing midnight on it.
  if (palette.isLight) return null;

  return (
    <group ref={sky} renderOrder={-1000}>
      <mesh renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[500, quality === "high" ? 40 : 24, quality === "high" ? 26 : 16]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <points renderOrder={-999} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={STAR_SIZE}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.84}
          depthWrite={false}
          // Test against the world: transparent objects draw after every
          // opaque one, so without this the stars paint straight over the
          // terrain and read as stars lying on the ground.
          depthTest
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* A distant moon / planet: soft glow first, a dim disc on top.
          All three test depth so terrain in front of them hides the glow. */}
      <sprite position={[132, 58, -236]} scale={[64, 64, 1]} renderOrder={-998}>
        <spriteMaterial
          map={texture}
          color="#5f93a8"
          transparent
          opacity={0.14}
          depthWrite={false}
          depthTest
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh position={[132, 58, -236]} renderOrder={-997}>
        <sphereGeometry args={[9, 24, 16]} />
        <meshBasicMaterial color="#0a2735" fog={false} depthWrite={false} depthTest toneMapped={false} />
      </mesh>
      <sprite position={[132, 58, -236]} scale={[20, 20, 1]} renderOrder={-996}>
        <spriteMaterial
          map={texture}
          color="#9cc6d4"
          transparent
          opacity={0.22}
          depthWrite={false}
          depthTest
          fog={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
