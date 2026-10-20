"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions, useWorldState } from "@/lib/world/store";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { useSceneTheme, mixHex } from "@/lib/world/scene-theme";
import { readJson, writeJson } from "@/lib/storage";
import { Campsite } from "./Campsite";
import { Forest } from "./Forest";
import { GateCinematic } from "./GateCinematic";

const WORLD_ENTERED_KEY = "world-entered";

const ACCENT = "#63f5e7";
const PATH_WIDTH = 1.45;
const PATH_ROUTES: [number, number, number][][] = [
  [[0, 0.025, 16], [0, 0.025, 12], [0.2, 0.025, 8], [-0.35, 0.025, 5], [0, 0.025, 2]],
  [[0, 0.025, 2], [-0.8, 0.025, 1.6], [-1.8, 0.025, 1.6], [-2.5, 0.025, 2]],
  [[0, 0.025, 2], [1, 0.025, 1.5], [2, 0.025, 1.3], [3, 0.025, 1.5]],
  [[0, 0.025, 2], [-1.2, 0.025, 0.8], [-2.6, 0.025, -0.2], [-4, 0.025, -1]],
];

function makePathRibbon(
  curve: THREE.CatmullRomCurve3,
  width: number,
  sideOffset = 0,
): THREE.BufferGeometry {
  const samples = curve.getPoints(64);
  const positions = new Float32Array(samples.length * 2 * 3);
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i += 1) {
    const point = samples[i];
    const tangent = curve.getTangent(i / (samples.length - 1));
    const sideX = -tangent.z;
    const sideZ = tangent.x;
    const centerX = point.x + sideX * sideOffset;
    const centerZ = point.z + sideZ * sideOffset;
    const halfWidth = width / 2;
    const vertex = i * 6;

    positions[vertex] = centerX + sideX * halfWidth;
    positions[vertex + 1] = point.y;
    positions[vertex + 2] = centerZ + sideZ * halfWidth;
    positions[vertex + 3] = centerX - sideX * halfWidth;
    positions[vertex + 4] = point.y;
    positions[vertex + 5] = centerZ - sideZ * halfWidth;

    if (i < samples.length - 1) {
      const first = i * 2;
      indices.push(first, first + 2, first + 1, first + 1, first + 2, first + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function PathPulses({ paths }: { paths: Array<{ curve: THREE.CatmullRomCurve3 }> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const palette = useSceneTheme();
  const markers = useMemo(
    () =>
      paths.flatMap(({ curve }, routeIndex) => {
        const count = routeIndex === 0 ? 6 : 3;
        return Array.from({ length: count }, (_, index) => ({
          curve,
          routeIndex,
          phase: index / count,
        }));
      }),
    [paths],
  );
  const geometry = useMemo(() => new THREE.SphereGeometry(0.065, 6, 5), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: palette.accent(ACCENT),
        toneMapped: false,
      }),
    [palette],
  );
  const markerRef = useRef(new THREE.Object3D());
  const reduced = usePrefersReducedMotion();

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const marker = markerRef.current;
    for (let i = 0; i < markers.length; i += 1) {
      const { curve, routeIndex, phase } = markers[i];
      const progress = reduced
        ? phase
        : 0.5 - 0.5 * Math.cos(clock.elapsedTime * 0.28 + phase * Math.PI * 2 + routeIndex * 0.7);
      const point = curve.getPointAt(progress);
      marker.position.set(point.x, point.y + 0.07, point.z);
      const scale = reduced
        ? 0.75
        : 0.76 + Math.sin(clock.elapsedTime * 0.8 + phase * Math.PI * 2) * 0.04;
      marker.scale.setScalar(scale);
      marker.updateMatrix();
      mesh.setMatrixAt(i, marker.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, material, markers.length]} frustumCulled={false} />
  );
}

const POSES: Record<string, CameraPose> = {
  entrance: { position: [0, 6.2, 35], lookAt: [0, 4.3, 17] },
  overview: { position: [0, 3.2, 10], lookAt: [0, 1.2, 0] },
  map: { position: [0, 2.2, 6.5], lookAt: [0, 1, 0] },
  camp: { position: [-1.5, 2.4, 8.0], lookAt: [-4.6, 0.7, 2.4] },
  temple: { position: [-2.5, 2, 5], lookAt: [-5, 1.5, 2] },
  vault: { position: [2.8, 2, 5], lookAt: [5.5, 1.2, 1] },
  beacon: { position: [0, 2.4, 4], lookAt: [0, 1.8, 0] },
};

/** Glowing path strip on the valley floor. */
function ValleyPath() {
  const palette = useSceneTheme();
  const paths = useMemo(
    () =>
      PATH_ROUTES.map((route) => {
        const curve = new THREE.CatmullRomCurve3(route.map((point) => new THREE.Vector3(...point)));
        return {
          curve,
          ground: makePathRibbon(curve, PATH_WIDTH),
          edges: [
            makePathRibbon(curve, 0.035, PATH_WIDTH / 2 - 0.06),
            makePathRibbon(curve, 0.035, -PATH_WIDTH / 2 + 0.06),
          ],
        };
      }),
    [],
  );

  return (
    <group>
      {paths.map((path, index) => (
        <group key={index}>
          <mesh geometry={path.ground} receiveShadow>
            <meshStandardMaterial
              color={mixHex(palette.floorDeep, palette.stoneDark, 0.42)}
              roughness={0.92}
            />
          </mesh>
          {path.edges.map((edge, edgeIndex) => (
            <mesh key={edgeIndex} geometry={edge}>
              <meshBasicMaterial
                color={palette.accent(ACCENT)}
                transparent
                opacity={0.52}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
      <PathPulses paths={paths} />
    </group>
  );
}

function ValleyTerrain() {
  const palette = useSceneTheme();
  const geometry = useMemo(() => {
    const terrain = new THREE.PlaneGeometry(300, 300, 96, 96);
    const positions = terrain.attributes.position;

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = -positions.getY(i);
      const distance = Math.hypot(x, z);
      const rise = THREE.MathUtils.smoothstep(distance, 24, 108);
      const ridges =
        Math.sin(x * 0.04 + Math.sin(z * 0.025) * 1.7) * 1.6 +
        Math.sin(z * 0.075 + x * 0.018) * 0.7;

      positions.setZ(i, rise * (ridges + rise * 3.2));
    }

    terrain.computeVertexNormals();
    return terrain;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={palette.floor} roughness={0.96} />
    </mesh>
  );
}

/** Distant floating islands — cheap cones with emissive undersides. */
function FloatingIsland({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const palette = useSceneTheme();
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[1.2, 1.8, 6]} />
        <meshStandardMaterial color={palette.stoneDark} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.9, 1, 6]} />
        <meshStandardMaterial color={palette.floorDeep} emissive={palette.accent(ACCENT)} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** The distant temple silhouette visible from the valley. */
function DistantTemple({
  position = [0, 0, -36] as [number, number, number],
  scale = 3.4,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const palette = useSceneTheme();
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]} receiveShadow>
        <boxGeometry args={[5.6, 0.7, 4.6]} />
        <meshStandardMaterial color={palette.stoneDark} roughness={0.98} flatShading />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[2.8, 3.6, 2.2]} />
        <meshStandardMaterial color={palette.stoneDark} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[2.2, 2, 4]} />
        <meshStandardMaterial color={palette.stone} emissive={palette.accent("#8fd8ff")} emissiveIntensity={0.34} flatShading />
      </mesh>
      {[-2.1, 2.1].map((x) => (
        <mesh key={x} position={[x, 2.2, 1.4]}>
          <cylinderGeometry args={[0.22, 0.3, 4.2, 6]} />
          <meshStandardMaterial color={palette.stoneDark} roughness={0.98} flatShading />
        </mesh>
      ))}
      <pointLight position={[0, 4.8, 0.6]} color="#8fd8ff" intensity={4} distance={9} decay={2} />
    </group>
  );
}

/** Central illuminated map pedestal. */
function MapPedestal() {
  const palette = useSceneTheme();
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.9, 1, 8]} />
        <meshStandardMaterial color={palette.stone} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 8]} />
        <meshStandardMaterial color={palette.plinth} emissive={palette.accent(ACCENT)} emissiveIntensity={1 * palette.glow} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color={ACCENT} intensity={3} distance={5} decay={2} />
    </group>
  );
}

/** Small bioluminescent crystal cluster. */
function GlowCrystals({
  position,
  color = ACCENT,
}: {
  position: [number, number, number];
  color?: string;
}) {
  const palette = useSceneTheme();
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.3 - 0.3, 0.3 + i * 0.12, i * 0.15 - 0.15]} rotation={[0.2 * i, i, 0.1]}>
          <octahedronGeometry args={[0.18 - i * 0.03, 0]} />
          <meshStandardMaterial color={mixHex(palette.stoneDark, color, 0.35)} emissive={palette.accent(color)} emissiveIntensity={1.8 * palette.glow} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={2.5} distance={3.5} decay={2} />
    </group>
  );
}

/**
 * Arrival Valley — Home. A lightweight alien landscape with a glowing path,
 * distant floating islands, a temple on the horizon, interactive crystals, a
 * central map pedestal that opens the star chart, and a living campsite — a
 * hand-built cabin and animated campfire ringed by wind-swept vegetation,
 * drifting spores, fireflies and low ground mist.
 */
export function ArrivalScene() {
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const { quality, worldEntry } = useWorldState();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");
  const [gateCleared, setGateCleared] = useState(false);
  const palette = useSceneTheme({ bg: "#d6ddd0", fog: "#dfe6da" });

  // Opening the gate clears the camera only once the leaves actually part.
  const handleGateOpened = useCallback(() => setGateCleared(true), []);

  const finishEntry = useCallback(() => {
    writeJson(WORLD_ENTERED_KEY, true);
    worldActions.completeWorldEntry();
  }, []);

  const skipEntry = useCallback(() => finishEntry(), [finishEntry]);

  // The value is intentionally read once per mount: it only decides whether
  // the entry copy mentions a skippable repeat visit.
  const [visitedBefore] = useState(() => readJson<boolean>(WORLD_ENTERED_KEY, false));

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.entrance.position}
        cameraFov={isMobile ? 72 : 46}
        background={palette.bg}
        fog={{
          color: palette.fog,
          density: palette.isLight ? 0.022 : 0.018,
        }}
        animate={worldEntry !== "outside"}
        interactive={worldEntry === "inside"}
      >
        <LightRig fillColor={ACCENT} intensity={0.85} />
        <CameraDirector
          pose={worldEntry === "outside" ? "entrance" : pose}
          poses={POSES}
          reduced={reduced}
          allowSteering={worldEntry === "inside"}
          suspended={worldEntry === "entering"}
        />
        <GateCinematic
          active={worldEntry === "entering"}
          cleared={gateCleared}
          reduced={reduced}
          onComplete={finishEntry}
        />

        <ValleyTerrain />
        {/* The main world gate is deliberately larger than every destination entrance. */}
        <TempleEntrance
          position={[0, 0, 17]}
          accent={ACCENT}
          open={worldEntry !== "outside"}
          width={6.2}
          height={6.8}
          scale={1.2}
          onOpened={handleGateOpened}
        />

        <DistantHorizon accent={ACCENT} scale={1.25} quality={quality} />
        <ValleyPath />
        <DistantTemple position={[0, 0, -38]} scale={3.8} />
        <MapPedestal />
        <Campsite quality={quality} reduced={reduced} />
        <Forest quality={quality} reduced={reduced} />

        <FloatingIsland position={[-8, 6, -10]} scale={1.4} />
        <FloatingIsland position={[7, 7.5, -12]} scale={1.8} />
        <FloatingIsland position={[2, 5.5, -9]} scale={1} />

        <GlowCrystals position={[-2.5, 0, 2]} />
        <GlowCrystals position={[3, 0, 1.5]} color="#b39dff" />
        <GlowCrystals position={[-4, 0, -1]} color="#6bffd0" />

        {/* Central map — opens star chart */}
        <Hotspot3D
          position={[0, 1.4, 0]}
          radius={0.9}
          accent={ACCENT}
          object={{
            id: "world-map",
            eyebrow: "ILLUMINATED MAP",
            title: "The World of Nebula",
            body: "Seven locations across one bioluminescent world. Choose where to explore next — every site section is a physical place you can enter.",
            actions: [{ label: "Open star chart", onClick: () => worldActions.toggleMap(true) }],
          }}
        />

        {/* Campsite beacon → basecamp */}
        <Hotspot3D
          position={[-4.1, 1.7, 2.5]}
          radius={0.85}
          accent="#ffb066"
          object={{
            id: "campsite",
            eyebrow: "CAMPSITE · BASECAMP",
            title: "The Workbench by the Fire",
            body: "Every frontier needs a home base. This is where ideas get sketched, systems get built, and long builds are seen through — one careful commit at a time.",
            actions: [
              { label: "Explore the world", onClick: () => worldActions.toggleMap(true) },
              { label: "About Saiful", href: "/about" },
            ],
          }}
        />

        {/* Temple beacon → About */}
        <Hotspot3D
          position={[0, 8, -38]}
          radius={5}
          accent="#8fd8ff"
          showIndicator={false}
          object={{
            id: "temple",
            eyebrow: "ANCIENT TEMPLE · 02",
            title: "About Saiful",
            body: "An ancient structure on the horizon. Inside: who I am, how I got here, and how I approach building software.",
            actions: [{ label: "Travel to the temple", href: "/about" }],
          }}
        />

        {/* Vault beacon → Projects */}
        <Hotspot3D
          position={[5.5, 1.4, 1]}
          radius={0.9}
          accent="#6bffd0"
          object={{
            id: "vault",
            eyebrow: "ARTIFACT VAULT · 05",
            title: "Projects & Case Studies",
            body: "A vault of real work — e-commerce platforms, dashboards, tracking systems and the reasoning behind each build.",
            actions: [{ label: "Enter the vault", href: "/work" }],
          }}
        />

        {/* Observatory beacon → Skills */}
        <Hotspot3D
          position={[2.5, 2, -3]}
          radius={0.85}
          accent="#b39dff"
          object={{
            id: "observatory",
            eyebrow: "HOLOGRAPHIC OBSERVATORY · 03",
            title: "Skills Constellation",
            body: "A constellation of the technologies I work with — Next.js, React, TypeScript, backend systems, e-commerce and measurement.",
            actions: [{ label: "Visit the observatory", href: "/skills" }],
          }}
        />

        {/* Comms beacon → Contact */}
        <Hotspot3D
          position={[0, 2.2, -5]}
          radius={0.85}
          accent="#ff8fb3"
          object={{
            id: "nexus",
            eyebrow: "COMMUNICATION NEXUS · 07",
            title: "Start a Conversation",
            body: "Have a project in mind? Open a channel — project form, WhatsApp or email. All three reach me directly.",
            actions: [{ label: "Open a channel", href: "/contact" }],
          }}
        />
      </SceneCanvas>

      {/* A light, top-weighted veil keeps the outside headline legible without hiding the gate. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: worldEntry === "outside"
            ? "linear-gradient(180deg, color-mix(in srgb, var(--bg) 34%, transparent), transparent 72%)"
            : "transparent",
        }}
      />

      {worldEntry === "outside" ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center sm:pt-36 sm:pb-28">
        <div className="flex w-full max-w-2xl flex-col items-center gap-5 sm:gap-6">
          <p className="font-mono text-[0.62rem] tracking-[0.3em] text-accent uppercase">
            NEBULA · THE DIGITAL FRONTIER
          </p>
          <h1 className="max-w-2xl font-display text-3xl leading-[1.1] text-ink sm:text-5xl">
            Building Digital Experiences Beyond the Ordinary.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-ink/85 sm:text-base">
            I&apos;m Saiful — a full-stack web developer building modern websites, applications and
            digital systems.
          </p>
          <div className="pointer-events-auto mt-1 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPose("overview");
                setGateCleared(false);
                worldActions.beginWorldEntry();
              }}
              className="btn-primary"
            >
              {visitedBefore ? "Enter World Again" : "Enter World"}
            </button>
          </div>
          <p className="pointer-events-none font-mono text-[0.56rem] tracking-[0.2em] text-faint uppercase">
            {visitedBefore ? "Returning through the gate" : "The gate will open, then the camera follows"}
          </p>
        </div>
      </div>
      ) : null}

      {worldEntry === "entering" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex flex-col items-center gap-3 px-6 text-center sm:bottom-28">
          <p
            role="status"
            className="font-mono text-[0.58rem] tracking-[0.24em] text-ink/80 uppercase"
          >
            {gateCleared ? "Crossing the threshold…" : "The gate is opening…"}
          </p>
          {visitedBefore ? (
            <button
              type="button"
              onClick={skipEntry}
              className="pointer-events-auto rounded-full border border-line bg-[var(--veil)] px-4 py-2 font-mono text-[0.56rem] tracking-[0.18em] text-dim uppercase backdrop-blur-md transition hover:border-linestrong hover:text-accent"
            >
              Skip intro
            </button>
          ) : null}
        </div>
      ) : null}
    </SceneScope>
  );
}
