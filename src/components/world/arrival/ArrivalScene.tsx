"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as THREE from "three";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions, useWorldState } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useSceneTheme, mixHex } from "@/lib/world/scene-theme";
import { readJson, writeJson } from "@/lib/storage";
import { Campsite } from "./Campsite";
import { Forest } from "./Forest";
import { GateCinematic } from "./GateCinematic";
import { HomeLandscape } from "./HomeLandscape";
import { HomeGrass } from "./home-grass";
import { HomeCampfires } from "./home-campfires";
import { HomeHomesteads } from "./home-homesteads";
import { HomeFireflies } from "./home-fireflies";
import { WalkController } from "./WalkController";
import { WalkHint, WalkJoystick } from "./WalkControls";
import { homeHeight } from "./home-terrain";
import { HOME_PATHS, homeWalkHeight } from "./home-world";

const WORLD_ENTERED_KEY = "world-entered";

const ACCENT = "#63f5e7";
const PATH_WIDTH = 2.1;

function buildPathCurve(route: [number, number][]): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    const [ax, az] = route[i];
    const [bx, bz] = route[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      points.push(new THREE.Vector3(x, homeWalkHeight(x, z) + 0.04, z));
    }
  }
  const [lx, lz] = route[route.length - 1];
  points.push(new THREE.Vector3(lx, homeWalkHeight(lx, lz) + 0.04, lz));
  return new THREE.CatmullRomCurve3(points, false, "centripetal");
}

function makePathRibbon(
  curve: THREE.CatmullRomCurve3,
  width: number,
  sideOffset = 0,
  lift = 0.07,
): THREE.BufferGeometry {
  const samples = curve.getPoints(120);
  const positions = new Float32Array(samples.length * 2 * 3);
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i += 1) {
    const point = samples[i];
    // Keep the ribbon on the actual ground (and bridge ramps) instead of
    // letting the spline float over crests or sink into the terrain.
    point.y = homeWalkHeight(point.x, point.z) + lift;
    const previous = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const tx = next.x - previous.x;
    const tz = next.z - previous.z;
    const length = Math.hypot(tx, tz) || 1;
    const sideX = -tz / length;
    const sideZ = tx / length;
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
  const reduced = usePrefersReducedMotion();
  const markers = useMemo(
    () =>
      paths.flatMap(({ curve }, routeIndex) => {
        const count = reduced ? 0 : routeIndex === 0 ? 4 : 2;
        return Array.from({ length: count }, (_, index) => ({
          curve,
          routeIndex,
          phase: index / count,
        }));
      }),
    [paths, reduced],
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
  const markerPoint = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh || reduced || markers.length === 0) return;
    const marker = markerRef.current;
    const point = markerPoint.current;
    for (let i = 0; i < markers.length; i += 1) {
      const { curve, routeIndex, phase } = markers[i];
      const progress = 0.5 - 0.5 * Math.cos(clock.elapsedTime * 0.24 + phase * Math.PI * 2 + routeIndex * 0.7);
      curve.getPointAt(progress, point);
      marker.position.set(point.x, point.y + 0.07, point.z);
      const scale = 0.76 + Math.sin(clock.elapsedTime * 0.7 + phase * Math.PI * 2) * 0.03;
      marker.scale.setScalar(scale);
      marker.updateMatrix();
      mesh.setMatrixAt(i, marker.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (reduced || markers.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[geometry, material, markers.length]} frustumCulled={false} />
  );
}

const POSES: Record<string, CameraPose> = {
  entrance: { position: [0, 6.2, 35], lookAt: [0, 4.3, 17] },
  overview: { position: [0, 3.4, 10], lookAt: [0, 2.2, -24] },
  gateway: { position: [0, 3.4, 9], lookAt: [0, 3.6, 17] },
  valley: { position: [10.5, 6.2, -31], lookAt: [0, 1.1, -40] },
  canyon: { position: [-14, 9, 2], lookAt: [0, 4, -80] },
  map: { position: [0, 2.2, 6.5], lookAt: [0, 1, 0] },
  camp: { position: [-1.5, 2.4, 8.0], lookAt: [-4.6, 0.7, 2.4] },
  temple: { position: [-2.5, 2, 5], lookAt: [-5, 1.5, 2] },
  vault: { position: [2.8, 2, 5], lookAt: [5.5, 1.2, 1] },
  beacon: { position: [0, 2.4, 4], lookAt: [0, 1.8, 0] },
};

const VANTAGES: { id: keyof typeof POSES; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "gateway", label: "Gate" },
  { id: "valley", label: "Causeway" },
  { id: "canyon", label: "Canyon" },
];

const TEMPLE_X = -26;
const TEMPLE_Z = -86;
const TEMPLE_POSITION: [number, number, number] = [
  TEMPLE_X,
  homeHeight(TEMPLE_X, TEMPLE_Z) - 0.2,
  TEMPLE_Z,
];

/** Glowing path strip on the valley floor. */
function ValleyPath() {
  const palette = useSceneTheme();
  // Build every route once, then merge the six road ribbons and ten glowing
  // edge ribbons into two meshes. Six separate materials were paying a draw
  // call each for identical material state.
  const merged = useMemo(() => {
    const built = HOME_PATHS.map((route) => {
      const curve = buildPathCurve(route);
      return {
        curve,
        ground: makePathRibbon(curve, PATH_WIDTH),
        edges: [
          makePathRibbon(curve, 0.09, PATH_WIDTH / 2 - 0.08, 0.081),
          makePathRibbon(curve, 0.09, -PATH_WIDTH / 2 + 0.08, 0.081),
        ],
      };
    });
    return {
      paths: built.map(({ curve }) => ({ curve })),
      ground: mergeGeometries(built.map((path) => path.ground))!,
      edges: mergeGeometries(built.flatMap((path) => path.edges))!,
    };
  }, []);

  return (
    <group>
      <mesh geometry={merged.ground} receiveShadow>
        <meshStandardMaterial
          color={mixHex(palette.floorDeep, palette.isLight ? "#8d7d58" : "#7a684a", 0.72)}
          roughness={0.92}
        />
      </mesh>
      <mesh geometry={merged.edges}>
        <meshBasicMaterial
          color={palette.accent(ACCENT)}
          transparent
          opacity={0.34}
          toneMapped={false}
        />
      </mesh>
      <PathPulses paths={merged.paths} />
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
    </group>
  );
}

/**
 * Arrival Valley — Home. A vast alien frontier: layered terrain cut by the Long
 * Ravine, giant monoliths, a distant bioluminescent forest, a stone causeway,
 * the Great Arch and the temple on the far ridge — plus a central map pedestal
 * that opens the star chart and a living campsite ringed by drifting spores,
 * fireflies and low ground mist.
 */
export function ArrivalScene() {
  const reduced = usePrefersReducedMotion();
  const { quality, worldEntry, walkMode, nearby, activeObject, mapOpen, codex, collectionOpen } =
    useWorldState();
  const walking = worldEntry === "inside" && walkMode;
  const overlaysOpen = Boolean(activeObject) || mapOpen || codex !== null || collectionOpen;
  const [pose, setPose] = useState<keyof typeof POSES>("overview");
  const [gateCleared, setGateCleared] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const palette = useSceneTheme({ bg: "#d6ddd0", fog: "#dfe6da" });

  // Opening the gate clears the camera only once the leaves actually part.
  const handleGateOpened = useCallback(() => setGateCleared(true), []);

  const finishEntry = useCallback(() => {
    writeJson(WORLD_ENTERED_KEY, true);
    worldActions.completeWorldEntry();
    worldActions.setWalkMode(true);
  }, []);

  const skipEntry = useCallback(() => setSkipRequested(true), []);

  // The value is intentionally read once per mount: it only decides whether
  // the entry copy mentions a skippable repeat visit.
  const [visitedBefore] = useState(() => readJson<boolean>(WORLD_ENTERED_KEY, false));

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.entrance.position}
        cameraFov={46}
        background={palette.bg}
        fog={{
          color: palette.fog,
          density: palette.isLight ? 0.011 : 0.009,
        }}
        animate={worldEntry !== "outside"}
        interactive={worldEntry === "inside"}
      >
        <LightRig fillColor={ACCENT} intensity={0.85} />
        <CameraDirector
          pose={worldEntry === "outside" ? "entrance" : pose}
          poses={POSES}
          reduced={reduced}
          baseFov={46}
          allowSteering={worldEntry === "inside" && !walkMode}
          suspended={worldEntry === "entering" || walking}
        />
        <WalkController active={walking} quality={quality} reduced={reduced} />
        <GateCinematic
          active={worldEntry === "entering"}
          cleared={gateCleared}
          skip={skipRequested}
          reduced={reduced}
          onComplete={finishEntry}
        />

        <HomeLandscape quality={quality} reduced={reduced} />
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

        <DistantHorizon accent={ACCENT} scale={1.25} quality={quality} floating={false} />
        <ValleyPath />
        <DistantTemple position={TEMPLE_POSITION} scale={4.2} />
        <MapPedestal />
        <Campsite quality={quality} reduced={reduced} />
        <HomeHomesteads reduced={reduced} />
        <HomeGrass quality={quality} reduced={reduced} />
        <HomeCampfires quality={quality} reduced={reduced} />
        <HomeFireflies quality={quality} reduced={reduced} />
        <Forest quality={quality} reduced={reduced} grass={false} />

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

        {/* Causeway overlook — a reason to walk the valley and see the scale. */}
        <Hotspot3D
          position={[0, 1.5, -31]}
          radius={4}
          accent={ACCENT}
          showIndicator={false}
          object={{
            id: "causeway",
            eyebrow: "THE LONG CAUSEWAY",
            title: "A Crossing Over the Ravine",
            body: "A stone bridge spans the deep cut in the valley floor. From the middle, the forest, the Great Arch and the temple on the far ridge line up across the haze.",
            actions: [{ label: "Take the overlook", onClick: () => setPose("valley") }],
          }}
        />

        {/* Great Arch — optional landmark, no destination required. */}
        <Hotspot3D
          position={[0, 30, -108]}
          radius={26}
          accent="#8fd8ff"
          showIndicator={false}
          object={{
            id: "great-arch",
            eyebrow: "THE GREAT ARCH · NORTH RIDGE",
            title: "A Monument Older Than the Map",
            body: "The arch frames the temple approach. No record says who raised it — only that the road was already old when the first surveyors arrived.",
            actions: [{ label: "View from the canyon", onClick: () => setPose("canyon") }],
          }}
        />

        {/* Temple beacon → About */}
        <Hotspot3D
          position={[TEMPLE_X, homeHeight(TEMPLE_X, TEMPLE_Z) + 15, TEMPLE_Z]}
          radius={13}
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

      {worldEntry === "inside" ? (
        <>
          <WalkHint visible={walking && !overlaysOpen} accent={ACCENT} />
          <WalkJoystick visible={walking && !overlaysOpen} />
          {walking && nearby && !overlaysOpen ? (
            <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-4">
              <p className="rounded-full border border-line bg-[var(--veil)] px-3.5 py-1.5 font-mono text-[0.5rem] tracking-[0.17em] text-dim uppercase backdrop-blur-md">
                {nearby}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

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

      {worldEntry === "inside" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4 sm:bottom-24">
          <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-[var(--veil)] p-1 backdrop-blur-md">
            <button
              type="button"
              aria-pressed={walking}
              onClick={() => worldActions.setWalkMode(true)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[0.53rem] tracking-[0.16em] uppercase transition ${
                walking
                  ? "bg-accent/15 text-accent"
                  : "text-dim hover:bg-[var(--veil)] hover:text-ink"
              }`}
            >
              Walk
            </button>
            {VANTAGES.map((vantage) => {
              const active = !walking && pose === vantage.id;
              return (
                <button
                  key={vantage.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    worldActions.setWalkMode(false);
                    setPose(vantage.id);
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[0.53rem] tracking-[0.16em] uppercase transition ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-dim hover:bg-[var(--veil)] hover:text-ink"
                  }`}
                >
                  {vantage.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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
                setSkipRequested(false);
                worldActions.setWalkMode(false);
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
          <button
            type="button"
            onClick={skipEntry}
            className="pointer-events-auto rounded-full border border-line bg-[var(--veil)] px-4 py-2 font-mono text-[0.56rem] tracking-[0.18em] text-dim uppercase backdrop-blur-md transition hover:border-linestrong hover:text-accent"
          >
            Skip intro
          </button>
        </div>
      ) : null}
    </SceneScope>
  );
}
