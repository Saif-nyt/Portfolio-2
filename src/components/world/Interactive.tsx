"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  getMoveInput,
  getZoom,
  resetZoom,
  worldActions,
  type ActiveObject,
} from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useSceneTheme } from "@/lib/world/scene-theme";
import { getDotTexture } from "@/components/world/arrival/fx-textures";

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
  const ring2Ref = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme();
  const shadowTex = useMemo(() => getDotTexture(), []);
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
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.36;
    }
    if (orbRef.current) {
      orbRef.current.position.y = 0.15 + Math.sin(t * 1.4) * 0.08;
      orbRef.current.rotation.y += 0.004 * pulse;
    }
    if (coreRef.current) {
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = ((hovered ? 2.4 : 1.5) + Math.sin(t * 3) * 0.3) * palette.glow;
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

  const orbAccent = palette.accent(accent);

  return (
    <group position={position}>
      {/* Invisible hit target — generous for touch. */}
      <mesh onClick={onClick} onPointerOver={onOver} onPointerOut={onOut} visible={false}>
        <sphereGeometry args={[radius, 12, 12]} />
      </mesh>

      {/* Soft contact shadow so the artifact sits on the floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.37, 0]}>
        <planeGeometry args={[radius * 2.4, radius * 2.4]} />
        <meshBasicMaterial
          map={shadowTex}
          color={palette.isLight ? "#4a4436" : "#000000"}
          transparent
          opacity={palette.isLight ? 0.4 : 0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Ground ring — the artifact's dais marking. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
        <torusGeometry args={[radius * 0.85, 0.035, 8, 36]} />
        <meshStandardMaterial
          color={orbAccent}
          emissive={orbAccent}
          emissiveIntensity={(hovered ? 2.4 : 1.4) * palette.glow}
          toneMapped={false}
        />
      </mesh>

      {/* Tilted containment ring for depth. */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.6, 0, 0]} position={[0, 0.1, 0]}>
        <torusGeometry args={[radius * 0.62, 0.018, 6, 28]} />
        <meshBasicMaterial
          color={orbAccent}
          transparent
          opacity={hovered ? 0.85 : 0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Faceted crystal body floating over an emissive core. */}
      <group ref={orbRef}>
        <mesh>
          <octahedronGeometry args={[radius * 0.36, 0]} />
          <meshStandardMaterial
            color={palette.metal}
            emissive={orbAccent}
            emissiveIntensity={0.35 * palette.glow}
            roughness={0.2}
            metalness={0.35}
            flatShading
            toneMapped={false}
          />
        </mesh>
        <mesh ref={coreRef} scale={0.55}>
          <icosahedronGeometry args={[radius * 0.36, 1]} />
          <meshStandardMaterial
            color={palette.plinth}
            emissive={orbAccent}
            emissiveIntensity={1.5 * palette.glow}
            roughness={0.25}
            metalness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      <pointLight
        position={[0, 0.4, 0]}
        color={accent}
        intensity={(hovered ? 5 : 3) * (palette.isLight ? 0.7 : 1)}
        distance={5}
        decay={2}
      />
      {children}
    </group>
  );
}

/** Ambient light rig shared by all zones — cheap, no shadow maps by default.
 *  Reads the active theme so the world switches from bioluminescent night to
 *  warm daylight instead of staying permanently dark. */
export function LightRig({
  keyColor,
  fillColor = "#63f5e7",
  intensity = 0.9,
}: {
  keyColor?: string;
  fillColor?: string;
  intensity?: number;
}) {
  const palette = useSceneTheme();
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const resolvedKey = palette.isLight ? palette.key : keyColor ?? palette.key;
  const resolvedKeyIntensity = palette.isLight ? palette.keyIntensity : intensity;
  useFrame(({ camera }) => {
    if (!lightRef.current) return;
    const target = lightRef.current.target;
    target.position.set(camera.position.x, 0, 0);
    target.updateMatrixWorld();
    lightRef.current.position.set(camera.position.x - 4, 9, 5);
  });

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} color={palette.ambient} />
      <hemisphereLight
        args={[palette.hemisphereSky, palette.hemisphereGround, palette.hemisphereIntensity]}
      />
      <directionalLight
        ref={lightRef}
        position={[-4, 9, 5]}
        intensity={resolvedKeyIntensity}
        color={resolvedKey}
      />
      <directionalLight
        position={[8, 3, -6]}
        intensity={palette.isLight ? palette.fillIntensity : 0.16}
        color={fillColor}
      />
    </>
  );
}

export interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

/** Orbit and pitch speeds at full joystick displacement. */
const YAW_SPEED = 1.6;
const PITCH_SPEED = 1.1;
/** Vertical look limits (radians), independent of camera height. */
const PITCH_MIN = -0.65;
const PITCH_MAX = 1.25;
/** Input easing — accelerates in and glides to a stop on release. */
const INPUT_EASE = 9;
/** How fast the camera eases toward the steered target (matches idle feel). */
const FOLLOW_EASE = 2.8;

/**
 * Simple camera state machine: lerp between named poses, with a drag-steering
 * layer on top. The full-screen touch surface (see `WorldNavSurface`) writes a
 * normalised vector into `getMoveInput()`, which this samples each frame to
 * orbit the pose's camera around its look-at point. Horizontal drag swings the
 * view a full 360°; vertical drag pitches it up and down (bounded so the orbit
 * never clips through the floor); a pinch (mobile) or ctrl-scroll (trackpad)
 * dollies along the view axis via `getZoom()`. Steering eases to rest when the
 * finger lifts.
 */
export function CameraDirector({
  pose,
  poses,
  reduced = false,
  allowSteering = true,
  onPoseComplete,
}: {
  pose: string;
  poses: Record<string, CameraPose>;
  reduced?: boolean;
  allowSteering?: boolean;
  onPoseComplete?: (pose: string) => void;
}) {
  const { camera } = useThree();
  const prefersReduced = usePrefersReducedMotion();
  const isReduced = reduced || prefersReduced;
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const steer = useRef({ yaw: 0, pitch: 0, ix: 0, iy: 0 });
  const completedPose = useRef<string | null>(null);

  // A new pose re-frames the shot (and travel remounts the scene), so forget any
  // drag steering — the authored composition always starts clean.
  useEffect(() => {
    completedPose.current = null;
    const s = steer.current;
    s.yaw = 0;
    s.pitch = 0;
    s.ix = 0;
    s.iy = 0;
    resetZoom();
  }, [pose]);

  useFrame((_, delta) => {
    const config = poses[pose] ?? poses[Object.keys(poses)[0]];
    if (!config) return;
    const dt = Math.min(delta, 0.05);
    const s = steer.current;

    // Sample the invisible joystick, then ease it so movement ramps in under
    // the finger and glides to a stop when it lifts (frame-rate independent).
    const input = allowSteering ? getMoveInput() : { x: 0, y: 0 };
    const ease = 1 - Math.exp(-INPUT_EASE * dt);
    s.ix += (input.x - s.ix) * ease;
    s.iy += (input.y - s.iy) * ease;
    // Horizontal drag orbits a full, unclamped 360°; vertical drag pitches.
    s.yaw += s.ix * YAW_SPEED * dt;
    s.pitch += s.iy * PITCH_SPEED * dt;

    // Rebuild the pose's offset in spherical coordinates around its look-at
    // point so yaw can wrap past ±π without gimbal drift, then apply pitch and
    // the pinch/scroll dolly. The radius is bounded to keep the rig inside the
    // authored space instead of punching through its geometry.
    const [lx, ly, lz] = config.lookAt;
    offset.set(config.position[0] - lx, config.position[1] - ly, config.position[2] - lz);
    const baseR = offset.length() || 1;
    const basePhi = Math.asin(THREE.MathUtils.clamp(offset.y / baseR, -1, 1));
    s.pitch = THREE.MathUtils.clamp(s.pitch, PITCH_MIN - basePhi, PITCH_MAX - basePhi);
    const baseTheta = Math.atan2(offset.x, offset.z);
    const theta = baseTheta + s.yaw;
    const phi = THREE.MathUtils.clamp(basePhi + s.pitch, PITCH_MIN, PITCH_MAX);
    const r = THREE.MathUtils.clamp(baseR * Math.exp(-getZoom()), baseR * 0.32, baseR * 2.6);
    const cosBasePhi = Math.cos(basePhi);
    const ox = Math.sin(theta) * cosBasePhi * r;
    const oy = Math.sin(basePhi) * r;
    const oz = Math.cos(theta) * cosBasePhi * r;

    targetPos.set(lx + ox, Math.max(0.75, ly + oy), lz + oz);
    const horizontalDistance = Math.max(0.001, cosBasePhi * r);
    targetLook.set(lx, targetPos.y - Math.tan(phi) * horizontalDistance, lz);

    if (isReduced) {
      camera.position.copy(targetPos);
      currentLook.copy(targetLook);
    } else {
      camera.position.lerp(targetPos, 1 - Math.exp(-dt * FOLLOW_EASE));
      currentLook.lerp(targetLook, 1 - Math.exp(-dt * FOLLOW_EASE));
    }
    camera.lookAt(currentLook);

    if (
      onPoseComplete &&
      completedPose.current !== pose &&
      camera.position.distanceTo(targetPos) < 0.08 &&
      currentLook.distanceTo(targetLook) < 0.08
    ) {
      completedPose.current = pose;
      onPoseComplete(pose);
    }
  });

  return null;
}
