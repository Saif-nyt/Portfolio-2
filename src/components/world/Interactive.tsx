"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  getMoveInput,
  getZoom,
  resetZoom,
  worldActions,
  type ActiveObject,
} from "@/lib/world/store";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { useSceneTheme } from "@/lib/world/scene-theme";
import { entrancePullScale } from "@/lib/world/viewport";
import { getDotTexture } from "@/components/world/arrival/fx-textures";
import { requestWorldFrame } from "@/lib/world/render-loop";
import { createRimGlowMaterial, glowDamp } from "@/lib/world/crisp-glow";

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
  /** Keep the hit target while hiding the default crystal and light. */
  showIndicator?: boolean;
  /** Fires on pointer enter/exit even when the indicator is hidden, so a
   *  parent artifact (e.g. a Vault pedestal) can glow on hover. */
  onHoverChange?: (hovered: boolean) => void;
}

/**
 * A clickable 3D hotspot: a crisp ring + crystal indicator with a generous
 * invisible hit area. The crystal glow is a tightly-contained Fresnel rim
 * (see `crisp-glow`) — luminous at the silhouette, never a hazy halo. Hover
 * and selection brighten the glow with damped easing, and deselection eases
 * smoothly back to the idle level. Opens the shared holographic panel on
 * click; keyboard parity is provided by the DOM nav strip and world map.
 */
export function Hotspot3D({
  position,
  radius = 0.7,
  object,
  accent = "#63f5e7",
  children,
  disabled = false,
  pulse = 1,
  showIndicator = true,
  onHoverChange,
}: Hotspot3DProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Group>(null);
  // Hover is a ref, not state: crossing nine hotspots must not re-render the
  // scene tree. The damped mix below eases materials toward the target so
  // brightness never snaps or flickers.
  const hoveredRef = useRef(false);
  const hoverMixRef = useRef(0);
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme();
  const shadowTex = useMemo(() => getDotTexture(), []);
  // Stable per-instance phase so a row of hotspots breathes out of sync.
  // Keyed on the coordinate values (not the array identity) so callers can
  // pass inline `[x, y, z]` literals without retriggering the memo each render.
  const phaseX = position[0];
  const phaseZ = position[2];
  const phase = useMemo(() => phaseX * 1.7 + phaseZ * 0.9, [phaseX, phaseZ]);
  const orbAccent = palette.accent(accent);

  const ringGlow = useMemo(
    () =>
      createRimGlowMaterial({
        color: orbAccent,
        emissive: orbAccent,
        emissiveIntensity: 0.6,
        rimStrength: 0.25,
        rimPower: 2.6,
        roughness: 0.4,
        metalness: 0.1,
      }),
    [orbAccent],
  );
  const crystalGlow = useMemo(
    () =>
      createRimGlowMaterial({
        color: palette.metal,
        emissive: orbAccent,
        emissiveIntensity: 0.25,
        rimStrength: 0.55,
        rimPower: 3.4,
        roughness: 0.2,
        metalness: 0.35,
        flatShading: true,
      }),
    [palette.metal, orbAccent],
  );
  const coreGlow = useMemo(
    () =>
      createRimGlowMaterial({
        color: palette.plinth,
        emissive: orbAccent,
        emissiveIntensity: 0.55,
        rimStrength: 0.3,
        rimPower: 2.8,
        roughness: 0.25,
        metalness: 0.2,
      }),
    [palette.plinth, orbAccent],
  );
  const ring2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: orbAccent,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    [orbAccent],
  );

  // Imperative materials are not auto-disposed by R3F on unmount.
  useEffect(
    () => () => {
      ringGlow.material.dispose();
      crystalGlow.material.dispose();
      coreGlow.material.dispose();
    },
    [ringGlow, crystalGlow, coreGlow],
  );
  useEffect(() => () => ring2Mat.dispose(), [ring2Mat]);

  // Leaving the scene while a hotspot is hovered never delivers pointerout —
  // clear the cursor on unmount so the next page isn't stuck with it.
  useEffect(
    () => () => {
      if (document.body.style.cursor === "pointer") document.body.style.cursor = "";
    },
    [],
  );

  useFrame(({ clock }, delta) => {
    if (!showIndicator) return;
    const target = hoveredRef.current ? 1 : 0;
    // Reduced motion snaps; otherwise ease in/out frame-rate independently.
    hoverMixRef.current = reduced ? target : glowDamp(hoverMixRef.current, target, delta, 14);
    const mix = hoverMixRef.current;
    const glowScale = palette.glow;
    const t = clock.elapsedTime * pulse + phase;

    if (!reduced) {
      if (ringRef.current) {
        ringRef.current.rotation.z = t * 0.5;
        ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * (0.025 + mix * 0.03));
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.z = -t * 0.36;
      }
      if (orbRef.current) {
        orbRef.current.position.y = 0.15 + Math.sin(t * 1.4) * 0.08;
        orbRef.current.rotation.y += 0.003 * pulse;
      }
    }

    // Idle = subtle; hover/selection = brighter and more defined (stronger
    // rim). Nothing scales outward, so the glow never expands into haze.
    ringGlow.setGlow((0.6 + mix * 0.45) * glowScale, (0.25 + mix * 0.2) * glowScale);
    crystalGlow.setGlow((0.25 + mix * 0.25) * glowScale, (0.55 + mix * 0.4) * glowScale);
    coreGlow.setGlow(
      (0.55 + mix * 0.5 + (reduced ? 0 : Math.sin(t * 3) * 0.06)) * glowScale,
      (0.3 + mix * 0.25) * glowScale,
    );
    if (ring2Ref.current) {
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.45 + mix * 0.35;
    }

    // Keep the demand loop alive exactly while a transition is settling.
    if (Math.abs(target - mix) > 1e-3) requestWorldFrame();
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (disabled) return;
    event.stopPropagation();
    worldActions.openPanel(object);
  };

  const onOver = (event: ThreeEvent<PointerEvent>) => {
    if (disabled) return;
    event.stopPropagation();
    hoveredRef.current = true;
    onHoverChange?.(true);
    document.body.style.cursor = "pointer";
    requestWorldFrame();
  };

  const onOut = () => {
    hoveredRef.current = false;
    onHoverChange?.(false);
    document.body.style.cursor = "";
    requestWorldFrame();
  };

  return (
    <group position={position}>
      {/* Invisible hit target — generous for touch. */}
      <mesh onClick={onClick} onPointerOver={onOver} onPointerOut={onOut} visible={false}>
        <sphereGeometry args={[radius, 12, 12]} />
      </mesh>

      {showIndicator ? (
        <>
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
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]} material={ringGlow.material}>
            <torusGeometry args={[radius * 0.85, 0.035, 8, 36]} />
          </mesh>

          {/* Tilted containment ring for depth. */}
          <mesh ref={ring2Ref} rotation={[Math.PI / 2.6, 0, 0]} position={[0, 0.1, 0]} material={ring2Mat}>
            <torusGeometry args={[radius * 0.62, 0.018, 6, 28]} />
          </mesh>

          {/* Faceted crystal body floating over an emissive core. */}
          <group ref={orbRef}>
            <mesh material={crystalGlow.material}>
              <octahedronGeometry args={[radius * 0.36, 0]} />
            </mesh>
            <mesh scale={0.55} material={coreGlow.material}>
              <icosahedronGeometry args={[radius * 0.36, 1]} />
            </mesh>
          </group>
        </>
      ) : null}
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
const INPUT_EASE = 16;
/** Faster response while the finger/mouse is down; gentler settle afterwards. */
const FOLLOW_EASE_STEER = 18;
const FOLLOW_EASE_SETTLE = 7.5;

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
  suspended = false,
  baseFov = 44,
  yawLimit,
  onPoseComplete,
}: {
  pose: string;
  poses: Record<string, CameraPose>;
  reduced?: boolean;
  allowSteering?: boolean;
  /** Yield camera control to a scripted cinematic (gate entry, etc.). */
  suspended?: boolean;
  /** Authored vertical FOV for this scene — drives the entrance pull-back. */
  baseFov?: number;
  /**
   * Clamp total steering yaw (radians) around the pose's authored heading.
   * Interior rooms pass a limit so an orbit can never swing the camera
   * through a wall; open landscapes leave it unset for a full 360°.
   */
  yawLimit?: number;
  onPoseComplete?: (pose: string) => void;
}) {
  const { camera, size } = useThree();
  const prefersReduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
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
    // Start the pose transition even when the demand loop is idle (reduced
    // motion, an open vantage button, or a cached route being revisited).
    requestWorldFrame();
  }, [pose]);

  useFrame((_, delta) => {
    if (suspended) return;
    const config = poses[pose] ?? poses[Object.keys(poses)[0]];
    if (!config) return;
    const dt = Math.min(delta, 0.05);
    const s = steer.current;

    // Sample the invisible joystick, then ease it so movement ramps in under
    // the finger and glides to a stop when it lifts (frame-rate independent).
    const input = getMoveInput();
    const ease = 1 - Math.exp(-INPUT_EASE * dt);
    s.ix += ((allowSteering ? input.x : 0) - s.ix) * ease;
    s.iy += ((allowSteering ? input.y : 0) - s.iy) * ease;
    // Horizontal drag orbits the view; interior poses clamp it with `yawLimit`
    // so the camera can never orbit through a wall. Vertical drag pitches.
    s.yaw += s.ix * YAW_SPEED * dt;
    if (yawLimit !== undefined) {
      s.yaw = THREE.MathUtils.clamp(s.yaw, -yawLimit, yawLimit);
    }
    s.pitch += s.iy * PITCH_SPEED * dt;

    // Rebuild the pose's offset in spherical coordinates around its look-at
    // point so yaw can wrap past ±π without gimbal drift, then apply pitch and
    // the pinch/scroll dolly. The radius is bounded to keep the rig inside the
    // authored space instead of punching through its geometry.
    const [lx, ly, lz] = config.lookAt;
    offset.set(config.position[0] - lx, config.position[1] - ly, config.position[2] - lz);
    // The entrance shot has to fit the whole doorway; on narrow windows the
    // aspect-aware FOV can only partially compensate, so dolly back by the
    // framing that is still missing. Interior poses keep their authored radius.
    const pull = pose === "entrance"
      ? entrancePullScale(baseFov, size.width / Math.max(1, size.height), isMobile)
      : 1;
    const baseR = (offset.length() || 1) * pull;
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
      const steering = allowSteering && Math.abs(input.x) + Math.abs(input.y) > 0.005;
      const follow = steering ? FOLLOW_EASE_STEER : FOLLOW_EASE_SETTLE;
      camera.position.lerp(targetPos, 1 - Math.exp(-dt * follow));
      currentLook.lerp(targetLook, 1 - Math.exp(-dt * follow));
    }
    camera.lookAt(currentLook);

    // Keep the on-demand loop alive exactly until the shot (and released
    // steering momentum) has settled, then let it sleep again.
    const settling =
      camera.position.distanceToSquared(targetPos) > 1e-6 ||
      currentLook.distanceToSquared(targetLook) > 1e-6 ||
      Math.abs(s.ix) + Math.abs(s.iy) > 1e-4;
    if (settling) requestWorldFrame();

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
