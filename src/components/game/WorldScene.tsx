"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ZONES, type Zone } from "@/data/zones";
import {
  INTERACT_RANGE_U,
  PATH_HALF_WIDTH,
  SPAWN_WORLD,
  worldBridge,
  zoneToWorldX,
} from "@/components/game/world-bridge";
import { ExplorerCharacter } from "@/components/game/ExplorerCharacter";
import {
  CrystalCluster,
  KitStructure,
  ZoneModel,
} from "@/components/game/InteractableObject";
import { FloatingIslands, NatureScatter } from "@/components/game/NatureProps";
import { WorldEnvironment } from "@/components/game/WorldEnvironment";

const byId = (id: string) => ZONES.find((zone) => zone.id === id) as Zone;

/** Follow camera + near-zone detection + first-frame ready signal. */
function SceneController() {
  const { camera } = useThree();
  const lastNear = useRef<string | null>(null);
  const readyRef = useRef(false);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Signal first frame so the DOM loading overlay can dismiss.
    if (!readyRef.current) {
      readyRef.current = true;
      worldBridge.onSceneReady();
    }

    // ---- camera follow --------------------------------------------------
    desired.set(worldBridge.playerX - 2.2, 4.6, worldBridge.playerZ + 7.4);
    if (worldBridge.reducedMotion) {
      camera.position.copy(desired);
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-dt * 4.5));
    }
    lookAt.set(worldBridge.playerX + 0.6, 1.15, worldBridge.playerZ);
    camera.lookAt(lookAt);

    // ---- nearest zone ---------------------------------------------------
    let near: Zone | null = null;
    let best = INTERACT_RANGE_U;
    for (const zone of ZONES) {
      const distance = Math.abs(zoneToWorldX(zone.x) - worldBridge.playerX);
      if (distance < best) {
        best = distance;
        near = zone;
      }
    }
    const nearId = near?.id ?? null;
    if (nearId !== lastNear.current) {
      lastNear.current = nearId;
      worldBridge.nearZoneId = nearId;
      worldBridge.onNearZone(nearId);
    }
  });

  return null;
}

/** Invisible raycast plane for tap/click-to-move on the ground. */
function MovePlane() {
  const onPointerDown = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    // Interactables stopPropagation on their own clicks, so reaching here
    // means the ground was hit directly.
    worldBridge.moveTarget = {
      x: THREE.MathUtils.clamp(event.point.x, 1.2, 54),
      z: THREE.MathUtils.clamp(event.point.z, -PATH_HALF_WIDTH, PATH_HALF_WIDTH),
    };
  };
  return (
    <mesh
      position={[28, 0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={onPointerDown}
      visible={false}
    >
      <planeGeometry args={[58, PATH_HALF_WIDTH * 2]} />
    </mesh>
  );
}

function ZoneStructures() {
  return (
    <group>
      {/* 01 Landing — portal ring on a KayKit pad. */}
      <ZoneModel zone={byId("landing")} showPad>
        <KitStructure
          url="/models/kaykit/landingpad_small.gltf"
          scale={0.9}
          tint="#123a34"
          tintAmount={0.45}
        />
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[1.05, 0.08, 12, 40]} />
          <meshStandardMaterial color="#1a5a50" emissive="#37d6c5" emissiveIntensity={1.2} />
        </mesh>
        <pointLight position={[0, 1.7, 0]} color="#63f5e7" intensity={5} distance={7} decay={2} />
      </ZoneModel>

      {/* 02 Archives — base module. */}
      <ZoneModel zone={byId("archives")}>
        <KitStructure url="/models/kaykit/basemodule_A.gltf" scale={1.6} />
      </ZoneModel>

      {/* 03 Skills — floating crystal constellation. */}
      <CrystalCluster zone={byId("skills")} />

      {/* 04 Outpost — drill + lights. */}
      <ZoneModel zone={byId("outpost")}>
        <KitStructure url="/models/kaykit/drill_structure.gltf" scale={1.35} />
        <KitStructure url="/models/kaykit/lights.gltf" position={[1.8, 0, 0.6]} scale={1.1} />
      </ZoneModel>

      {/* 05 Vault — cargo containers. */}
      <ZoneModel zone={byId("vault")}>
        <KitStructure url="/models/kaykit/cargodepot_A.gltf" scale={1.25} />
        <KitStructure
          url="/models/kaykit/containers_A.gltf"
          position={[-1.6, 0, 0.4]}
          rotation={[0, 0.5, 0]}
          scale={1.1}
        />
        <KitStructure
          url="/models/kaykit/cargo_B_stacked.gltf"
          position={[1.5, 0, -0.5]}
          rotation={[0, -0.4, 0]}
          scale={1}
        />
      </ZoneModel>

      {/* Library — smaller module (bonus zone). */}
      <ZoneModel zone={byId("library")}>
        <KitStructure url="/models/kaykit/basemodule_D.gltf" scale={1.3} />
      </ZoneModel>

      {/* 06 Nexus — lander + comms beacon. */}
      <ZoneModel zone={byId("nexus")}>
        <KitStructure url="/models/kaykit/lander_A.gltf" scale={1.3} />
        <mesh position={[0, 2.6, 0]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial
            color="#63f5e7"
            emissive="#63f5e7"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
        <pointLight position={[0, 2.7, 0]} color="#63f5e7" intensity={6} distance={8} decay={2} />
      </ZoneModel>
    </group>
  );
}

/**
 * Full 3D world: environment + scatter + zone landmarks + explorer,
 * all driven by the shared worldBridge from the DOM HUD.
 */
export function WorldScene({
  natureDensity,
  shadows,
  sporeCount,
}: {
  natureDensity: number;
  shadows: boolean;
  sporeCount: number;
}) {
  return (
    <group>
      <WorldEnvironment reduced={worldBridge.reducedMotion} shadows={shadows} sporeCount={sporeCount} />
      <MovePlane />
      <NatureScatter density={natureDensity} />
      <FloatingIslands reduced={worldBridge.reducedMotion} />
      <ZoneStructures />
      <ExplorerCharacter />
      <SceneController />
      {/* Small foreground rocks near spawn for immediate depth. */}
      <KitStructure
        url="/models/kaykit/rocks_A.gltf"
        position={[SPAWN_WORLD.x - 1.8, 0, 1.6]}
        rotation={[0, 0.7, 0]}
        scale={0.8}
      />
      <KitStructure
        url="/models/kaykit/rock_B.gltf"
        position={[SPAWN_WORLD.x + 2.4, 0, -1.8]}
        rotation={[0, 2.3, 0]}
        scale={0.7}
      />
    </group>
  );
}
