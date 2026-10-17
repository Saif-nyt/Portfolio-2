"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPAWN_WORLD, worldBridge } from "@/components/game/world-bridge";

const IDLE = "Idle";
const WALK = "Walk";

/**
 * The explorer: a real rigged GLB (Soldier.glb) with Idle/Walk clips,
 * re-tinted toward the NEBULA palette. Movement is driven by the shared
 * worldBridge; the mesh follows on the ground plane and rotates to face travel.
 *
 * The loaded scene is rendered in place (no hierarchy clone): animation
 * clips reference the original bones, so a cloned skeleton would never move.
 * Materials are swapped once on the cached scene instead. A single-material
 * mesh must NOT receive a one-element material array — geometries without
 * draw groups render nothing when material is an array.
 */
export function ExplorerCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/soldier.glb");

  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const currentName = useRef<string | null>(null);
  // Face down-path (+X) at spawn so the explorer isn't back-to-camera.
  const facingRef = useRef(Math.PI / 2);

  const clips = useMemo(() => {
    const byName = new Map(animations.map((clip) => [clip.name, clip]));
    return { idle: byName.get("Idle") ?? animations[0], walk: byName.get("Walk") };
  }, [animations]);

  // Manual mixer (rooted at the loaded scene): drei's useAnimations left the
  // skeleton in bind pose here; this mirrors the verified plain-three path.
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  useMemo(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;
      const wasArray = Array.isArray(child.material);
      const originals: THREE.Material[] = wasArray ? child.material : [child.material];
      const tinted = originals.map((original: THREE.Material) => {
        const material = original.clone() as THREE.MeshStandardMaterial;
        if (material.color) {
          // Push the gray soldier toward deep midnight-teal armour.
          material.color.lerp(new THREE.Color("#1a5248"), 0.45);
        }
        if (material.emissive) {
          material.emissive = new THREE.Color("#0d3f38");
          material.emissiveIntensity = 0.55;
        }
        return material;
      });
      child.material = wasArray ? (tinted as THREE.Material[]) : tinted[0];
    });
  }, [scene]);

  useEffect(() => {
    if (!clips.idle) return;
    const action = mixer.clipAction(clips.idle);
    action.play();
    currentAction.current = action;
    currentName.current = "Idle";
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [mixer, clips, scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);

    // ---- movement ----------------------------------------------------------
    let inputX = 0;
    let inputZ = 0;
    if (!worldBridge.teleport) {
      if (worldBridge.keys.left) inputX -= 1;
      if (worldBridge.keys.right) inputX += 1;
      if (worldBridge.keys.forward) inputZ -= 1;
      if (worldBridge.keys.back) inputZ += 1;
      if (worldBridge.joystick !== 0) inputX = worldBridge.joystick;
      if (inputX !== 0 || inputZ !== 0) worldBridge.moveTarget = null;
    }

    if (worldBridge.teleport) {
      worldBridge.playerX = worldBridge.teleport.x;
      worldBridge.playerZ = worldBridge.teleport.z;
      worldBridge.teleport = null;
      worldBridge.moveTarget = null;
      group.position.set(worldBridge.playerX, 0, worldBridge.playerZ);
    }

    let targetVX = inputX * 3.8;
    let targetVZ = inputZ * 3.2;

    if (worldBridge.moveTarget) {
      const dx = worldBridge.moveTarget.x - worldBridge.playerX;
      const dz = worldBridge.moveTarget.z - worldBridge.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        worldBridge.moveTarget = null;
        targetVX = 0;
        targetVZ = 0;
      } else {
        targetVX = (dx / dist) * 3.8;
        targetVZ = (dz / dist) * 3.8;
      }
    }

    worldBridge.playerX = THREE.MathUtils.clamp(worldBridge.playerX + targetVX * dt, 1.2, 54);
    worldBridge.playerZ = THREE.MathUtils.clamp(worldBridge.playerZ + targetVZ * dt, -4.2, 4.2);

    const walking = targetVX !== 0 || targetVZ !== 0;
    if (walking !== worldBridge.walking) {
      worldBridge.walking = walking;
      worldBridge.onWalkingChange(walking);
    }

    group.position.set(worldBridge.playerX, 0, worldBridge.playerZ);

    if (walking) {
      const targetFacing =
        Math.abs(targetVX) > 0.05 ? (targetVX > 0 ? Math.PI / 2 : -Math.PI / 2) : facingRef.current;
      facingRef.current = THREE.MathUtils.damp(facingRef.current, targetFacing, 10, dt);
      group.rotation.y = facingRef.current;
    }

    // ---- animation ---------------------------------------------------------
    mixer.update(dt);
    const wanted = walking ? WALK : IDLE;
    if (currentName.current !== wanted) {
      const clip = wanted === WALK ? clips.walk : clips.idle;
      if (clip) {
        const next = mixer.clipAction(clip);
        currentAction.current?.fadeOut(0.22);
        next.reset().fadeIn(0.22).play();
        currentAction.current = next;
        currentName.current = wanted;
      }
    }
  });

  return (
    <group ref={groupRef} position={[SPAWN_WORLD.x, 0, SPAWN_WORLD.z]} rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/soldier.glb");
