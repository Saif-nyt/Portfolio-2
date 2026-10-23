"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hash01 } from "@/lib/world/anim";
import { useWorldState } from "@/lib/world/store";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";

/**
 * Reusable cinematic primitives shared across the locations. Each one animates
 * a single ref in `useFrame` (never a memoized value), so it stays compatible
 * with the React-compiler lint rules and with the demand frameloop — when the
 * scene is covered or reduced motion is on, the loop just stops and the props
 * hold their current pose.
 */

interface FloaterProps {
  children: ReactNode;
  amplitude?: number;
  speed?: number;
  phase?: number;
  /** Constant yaw spin (rad/s). */
  spin?: number;
}

/** Bobs its children vertically and optionally spins them. */
export function Floater({ children, amplitude = 0.12, speed = 0.8, phase = 0, spin = 0 }: FloaterProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const group = ref.current;
    group.position.y = amplitude * Math.sin(state.clock.elapsedTime * speed + phase);
    if (spin) group.rotation.y += delta * spin;
  });
  return <group ref={ref}>{children}</group>;
}

/** Slow constant yaw rotation for a whole cluster. */
export function SpinGroup({
  children,
  speed = 0.05,
  position,
}: {
  children: ReactNode;
  speed?: number;
  position?: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

interface OrbitRingProps {
  position?: [number, number, number];
  radius?: number;
  color?: string;
  speed?: number;
  tilt?: number;
  opacity?: number;
}

/** A thin additive ring that rotates and softly breathes. */
export function OrbitRing({
  position = [0, 0, 0],
  radius = 1,
  color = "#ffffff",
  speed = 0.6,
  tilt = 0,
  opacity = 0.7,
}: OrbitRingProps) {
  const ref = useRef<THREE.Mesh>(null);
  const palette = useSceneTheme();
  const ringColor = palette.isLight ? mixHex(color, "#1c3f38", 0.5) : color;
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * speed;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity * (0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 1.6));
  });
  return (
    <mesh ref={ref} position={position} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 40]} />
      <meshBasicMaterial
        color={ringColor}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={palette.effectBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

interface RiseBeamProps {
  position?: [number, number, number];
  color?: string;
  radius?: number;
  height?: number;
  opacity?: number;
  speed?: number;
}

/** A soft additive column of light rising from a source, pulsing gently. */
export function RiseBeam({
  position = [0, 0, 0],
  color = "#ffffff",
  radius = 0.6,
  height = 3,
  opacity = 0.1,
  speed = 1.1,
}: RiseBeamProps) {
  const ref = useRef<THREE.Mesh>(null);
  const palette = useSceneTheme();
  const beamColor = palette.isLight ? mixHex(color, "#1c3f38", 0.45) : color;
  useFrame((state) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity * (0.55 + 0.45 * Math.sin(state.clock.elapsedTime * speed));
  });
  return (
    <mesh ref={ref} position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[radius * 0.35, radius, height, 20, 1, true]} />
      <meshBasicMaterial
        color={beamColor}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={palette.effectBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

const EMBER_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform float uSize;
attribute float aSeed;
attribute float aSpeed;
attribute float aPhase;
varying float vLife;
void main() {
  float rise = fract(uTime * aSpeed + aPhase);
  vLife = 1.0 - rise;
  vec3 p = position;
  p.y = rise * uHeight;
  p.x += sin(uTime * 1.7 + aSeed * 6.2831) * 0.35 * rise;
  p.z += cos(uTime * 1.3 + aSeed * 6.2831) * 0.35 * rise;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (300.0 / -mv.z) * (0.4 + 0.6 * vLife);
  gl_Position = projectionMatrix * mv;
}
`;

const EMBER_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
varying float vLife;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vLife;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

interface EmberFieldProps {
  count?: number;
  color?: string;
  radius?: number;
  height?: number;
  size?: number;
  speed?: number;
}

/** Rising sparks above a hot source — a single additive GPU point cloud. */
export function EmberField({
  count = 60,
  color = "#ffb36b",
  radius = 0.9,
  height = 3.5,
  size = 6,
  speed = 0.35,
}: EmberFieldProps) {
  const ref = useRef<THREE.Points>(null);
  const { quality } = useWorldState();
  const total = quality === "high" ? count : Math.max(10, Math.round(count * 0.4));

  const geometry = useMemo(() => {
    const positions = new Float32Array(total * 3);
    const seed = new Float32Array(total);
    const speeds = new Float32Array(total);
    const phase = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      const angle = hash01(i * 4 + 1) * Math.PI * 2;
      const r = Math.sqrt(hash01(i * 4 + 2)) * radius;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      seed[i] = hash01(i * 4 + 3);
      speeds[i] = speed * (0.6 + hash01(i * 4 + 4) * 0.9);
      phase[i] = hash01(i * 4 + 5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    geo.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1));
    geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
    return geo;
  }, [total, radius, speed]);
  // Imperative geometry is not auto-disposed by R3F; also covers the quality
  // tier flip that rebuilds the buffer with a different particle count.
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeight: { value: height },
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) },
    }),
    [height, size, color],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={EMBER_VERTEX}
        fragmentShader={EMBER_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
