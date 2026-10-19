"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";

interface BioluminescentGrowthProps {
  accent: string;
  positions: Array<[number, number]>;
}

export function BioluminescentGrowth({ accent, positions }: BioluminescentGrowthProps) {
  const stemsRef = useRef<THREE.InstancedMesh>(null);
  const bulbsRef = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const plants = useMemo(
    () =>
      positions.flatMap(([x, z], patchIndex) =>
        [-1, 0, 1].map((offset, plantIndex) => ({
          x: x + offset * 0.16,
          z: z + (plantIndex % 2 ? 0.08 : -0.08),
          height: 0.34 + ((patchIndex + plantIndex) % 3) * 0.08,
          scale: 0.82 + ((patchIndex + plantIndex * 2) % 3) * 0.12,
          rotation: offset * 0.24,
          phase: x * 0.71 + z * 0.43 + patchIndex * 1.8 + plantIndex * 2.1,
        })),
      ),
    [positions],
  );
  const stemGeometry = useMemo(() => new THREE.CylinderGeometry(0.035, 0.05, 1, 5), []);
  const bulbGeometry = useMemo(() => new THREE.SphereGeometry(0.075, 7, 5), []);
  const reduced = usePrefersReducedMotion();
  const transformRef = useRef(new THREE.Object3D());
  const stemPositionRef = useRef(new THREE.Vector3());
  const bulbPositionRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(new THREE.Euler());
  const stemMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: mixHex(palette.floorDeep, palette.accent(accent), 0.18),
        emissive: palette.accent(accent),
        emissiveIntensity: 0.12 * palette.glow,
        roughness: 0.9,
      }),
    [accent, palette],
  );
  const bulbMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.accent(accent),
        emissive: palette.accent(accent),
        emissiveIntensity: 0.72 * palette.glow,
        roughness: 0.55,
        toneMapped: false,
      }),
    [accent, palette],
  );

  useLayoutEffect(() => {
    const stems = stemsRef.current;
    const bulbs = bulbsRef.current;
    if (!stems || !bulbs) return;

    const object = new THREE.Object3D();
    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      object.position.set(plant.x, plant.height / 2, plant.z);
      object.rotation.set(0, plant.rotation, 0);
      object.scale.set(plant.scale, plant.height, plant.scale);
      object.updateMatrix();
      stems.setMatrixAt(i, object.matrix);

      object.position.set(plant.x, plant.height + 0.015, plant.z);
      object.scale.setScalar(plant.scale);
      object.updateMatrix();
      bulbs.setMatrixAt(i, object.matrix);
    }
    stems.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
  }, [plants]);

  useFrame(({ clock }) => {
    const stems = stemsRef.current;
    const bulbs = bulbsRef.current;
    if (!stems || !bulbs) return;

    const time = clock.elapsedTime;
    const transform = transformRef.current;
    const stemPosition = stemPositionRef.current;
    const bulbPosition = bulbPositionRef.current;
    const rotation = rotationRef.current;
    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      const swayZ = reduced
        ? 0
        : Math.sin(time * 0.72 + plant.phase) * 0.045 +
          Math.sin(time * 1.13 + plant.phase * 1.7) * 0.012;
      const swayX = reduced
        ? 0
        : Math.sin(time * 0.59 + plant.phase * 1.3) * 0.025;
      rotation.set(swayX, plant.rotation, swayZ);

      stemPosition.set(0, plant.height / 2, 0).applyEuler(rotation);
      transform.position.set(plant.x + stemPosition.x, stemPosition.y, plant.z + stemPosition.z);
      transform.rotation.copy(rotation);
      transform.scale.set(plant.scale, plant.height, plant.scale);
      transform.updateMatrix();
      stems.setMatrixAt(i, transform.matrix);

      bulbPosition.set(0, plant.height, 0).applyEuler(rotation);
      transform.position.set(plant.x + bulbPosition.x, bulbPosition.y + 0.015, plant.z + bulbPosition.z);
      transform.rotation.copy(rotation);
      const breathing = reduced
        ? 1
        : 1 + Math.sin(time * 0.9 + plant.phase) * 0.045;
      transform.scale.setScalar(plant.scale * breathing);
      transform.updateMatrix();
      bulbs.setMatrixAt(i, transform.matrix);
    }
    stems.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;

    const material = bulbs.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity =
      (0.68 + (reduced ? 0 : Math.sin(time * 0.65) * 0.06)) * palette.glow;
  });

  return (
    <group>
      <instancedMesh
        ref={stemsRef}
        args={[stemGeometry, stemMaterial, plants.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={bulbsRef}
        args={[bulbGeometry, bulbMaterial, plants.length]}
        frustumCulled={false}
      />
    </group>
  );
}
