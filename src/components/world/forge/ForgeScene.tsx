"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { EntrancePrompt } from "@/components/world/EntrancePrompt";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { AmbientMotes } from "@/components/world/AmbientMotes";
import { BioluminescentGrowth } from "@/components/world/BioluminescentGrowth";
import { EmberField, OrbitRing, RiseBeam } from "@/components/world/cinematics";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions } from "@/lib/world/store";
import { useSceneTheme } from "@/lib/world/scene-theme";

const ACCENT = "#ffb36b";
const GROWTH_POSITIONS: Array<[number, number]> = [
  [-7, -4],
  [-4, 6],
  [4, 6],
  [7, -4],
];

const POSES: Record<string, CameraPose> = {
  entrance: { position: [0, 3, 17], lookAt: [0, 2.8, 12] },
  overview: { position: [0, 3, 10], lookAt: [0, 1.2, 0] },
  stations: { position: [0, 2.2, 7], lookAt: [0, 1, 0] },
  left: { position: [-2.5, 2, 6], lookAt: [-4, 1, 0] },
  right: { position: [2.5, 2, 6], lookAt: [4, 1, 0] },
};

interface Station {
  id: string;
  position: [number, number, number];
  accent: string;
  title: string;
  problem: string;
  deliverables: string[];
  /** Service option preset carried into the contact form. */
  service: string;
}

const STATIONS: Station[] = [
  {
    id: "fullstack",
    position: [-4, 0.9, -1],
    accent: "#63f5e7",
    title: "Full-Stack Web Applications",
    service: "Full-Stack Web Development",
    problem:
      "You need a real application — auth, data, dashboards, workflows — not just a brochure site. I design the architecture and ship the whole thing.",
    deliverables: [
      "Application architecture and setup",
      "Frontend + backend implementation",
      "Database schema and integration",
      "Authentication and protected routes",
      "Deployment and handover",
    ],
  },
  {
    id: "frontend",
    position: [-1.4, 0.9, -1.5],
    accent: "#8fd8ff",
    title: "Frontend Development",
    service: "Full-Stack Web Development",
    problem:
      "You have a design (or a clear idea) and need it built into a fast, responsive, accessible interface that feels polished on every device.",
    deliverables: [
      "Pixel-faithful or design-system implementation",
      "Responsive layouts from mobile up",
      "Accessibility and keyboard support",
      "Performance tuning (Core Web Vitals)",
      "Component library handover",
    ],
  },
  {
    id: "backend",
    position: [1.4, 0.9, -1.5],
    accent: "#6bffd0",
    title: "Backend APIs & Databases",
    service: "Full-Stack Web Development",
    problem:
      "Your product needs an API layer — endpoints, data models, integrations — that is reliable, typed and ready for the frontend to consume.",
    deliverables: [
      "REST endpoint design and implementation",
      "Database schema and queries",
      "Input validation and error handling",
      "Third-party integrations",
      "Documentation and type definitions",
    ],
  },
  {
    id: "ecommerce",
    position: [4, 0.9, -1],
    accent: "#b39dff",
    title: "E-commerce Development",
    service: "E-commerce Growth Solutions",
    problem:
      "You need a storefront that converts — fast product pages, clear navigation and a checkout path that doesn't lose people.",
    deliverables: [
      "Storefront or WooCommerce / Shopify build",
      "Product and collection architecture",
      "Cart and checkout flow",
      "Payment and shipping integration",
      "Analytics and conversion tracking",
    ],
  },
  {
    id: "analytics",
    position: [0, 0.9, 1.5],
    accent: "#ffd36b",
    title: "Analytics & Tracking Integrations",
    service: "Server-Side Tracking & Conversion API",
    problem:
      "Your ads and analytics are guessing. I wire browser and server-side events properly — named, deduplicated and validated — so decisions rest on real data.",
    deliverables: [
      "Meta Pixel + Conversions API setup",
      "GA4 / analytics configuration",
      "Server-side event pipelines",
      "Event deduplication and QA",
      "Reporting dashboards",
    ],
  },
];

/** A futuristic workbench / station. */
function ForgeStation({
  station,
  active,
}: {
  station: Station;
  active: boolean;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const palette = useSceneTheme();
  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const t = clock.elapsedTime;
    const material = glowRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = (active ? 2.4 : 1 + Math.sin(t * 1.8 + station.position[0]) * 0.3) * palette.glow;
  });

  return (
    <group position={station.position}>
      {/* Base platform */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.3, 8]} />
        <meshStandardMaterial color={palette.stone} roughness={0.85} />
      </mesh>
      {/* Workbench surface */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.6, 0.12, 1]} />
        <meshStandardMaterial color={palette.metal} roughness={0.7} metalness={0.25} />
      </mesh>
      {/* Bench supports */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.42, 0.7]} />
          <meshStandardMaterial color={palette.stoneDark} roughness={0.9} />
        </mesh>
      ))}
      {/* Glowing core */}
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color={palette.plinth}
          emissive={palette.accent(station.accent)}
          emissiveIntensity={1}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={station.accent} intensity={active ? 5 : 3} distance={4.5} decay={2} />
    </group>
  );
}

/**
 * Technology Forge — Services. Five service stations arranged in a semicircle,
 * each activating on interaction and opening a concise service panel with a
 * "Discuss this project" action prefilled into the contact form.
 */
export function ForgeScene() {
  const router = useRouter();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");
  const [inside, setInside] = useState(false);
  const palette = useSceneTheme({ bg: "#e2d6c4", fog: "#ece1d1" });

  const discuss = (service: string) => {
    // Travel to the nexus and open the contact codex on arrival — the world
    // stays mounted; the form appears as an in-world overlay, not a page jump.
    worldActions.queueCodex("contact", "/contact");
    router.push(`/contact?service=${encodeURIComponent(service)}`);
  };

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.entrance.position}
        cameraFov={44}
        background={palette.bg}
        fog={{ color: palette.fog, density: palette.fogDensity }}
        animate
      >
        <LightRig fillColor={ACCENT} intensity={0.8} />
        <CameraDirector pose={inside ? (pose as string) : "entrance"} poses={POSES} />
        <DistantHorizon accent={ACCENT} scale={0.95} />
        <AmbientMotes color={palette.mote} radius={6} height={4.5} count={90} size={0.15} />
        <BioluminescentGrowth accent={ACCENT} positions={GROWTH_POSITIONS} />

        {/* The temple entrance into the forge */}
        <TempleEntrance position={[0, 0, 12]} accent={ACCENT} open={inside} />

        {/* Forge floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[9, 48]} />
          <meshStandardMaterial color={palette.floor} roughness={0.95} />
        </mesh>
        {/* Central forge pit glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.8, 1.6, 32]} />
          <meshStandardMaterial color={palette.stoneDark} emissive={palette.accent(ACCENT)} emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Living forge: rotating pit ring, rising heat column, and embers */}
        <OrbitRing position={[0, 0.06, 0]} radius={1.2} color={ACCENT} speed={0.35} opacity={0.45} />
        <RiseBeam position={[0, 0, 0]} color={ACCENT} radius={0.85} height={3.2} opacity={0.045} speed={0.9} />
        <EmberField count={46} color="#ffb46a" radius={0.95} height={3.4} size={3.6} speed={0.42} />

        {STATIONS.map((station) => (
          <group key={station.id}>
            <ForgeStation station={station} active={false} />
            <Hotspot3D
              position={[station.position[0], 1.4, station.position[2]]}
              radius={0.7}
              accent={station.accent}
              object={{
                id: station.id,
                eyebrow: "SERVICE STATION",
                title: station.title,
                body: station.problem,
                bullets: station.deliverables,
                actions: [
                  {
                    label: "Discuss this project",
                    onClick: () => discuss(station.service),
                  },
                  {
                    label: "See all services",
                    onClick: () => worldActions.openCodex("services"),
                  },
                ],
              }}
            />
          </group>
        ))}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em] uppercase" style={{ color: "var(--loc-accent-text)" }}>
          TECHNOLOGY FORGE · SERVICES
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          What I Can Build For You
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Five service stations. Click one to see the problem it solves and what&apos;s included.
        </p>
      </div>

      <EntrancePrompt label="the Forge" open={inside} onEnter={() => setInside(true)} />

      {inside ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap justify-center gap-2 px-4 sm:bottom-28">
          {(["overview", "stations", "left", "right"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPose(p)}
              className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.56rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setInside(false)}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.56rem] tracking-[0.16em] text-ink uppercase transition hover:text-accent"
          >
            Exit temple
          </button>
          <Link
            href="/"
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.56rem] tracking-[0.16em] text-ink uppercase transition hover:text-accent"
          >
            Arrival Valley
          </Link>
        </div>
      ) : null}
    </SceneScope>
  );
}
