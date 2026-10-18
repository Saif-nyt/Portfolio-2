"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";

const ACCENT = "#ffb36b";

const POSES: Record<string, CameraPose> = {
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
}

const STATIONS: Station[] = [
  {
    id: "fullstack",
    position: [-4, 0.9, -1],
    accent: "#63f5e7",
    title: "Full-Stack Web Applications",
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
  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const t = clock.elapsedTime;
    const material = glowRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = active ? 2.4 : 1 + Math.sin(t * 1.8 + station.position[0]) * 0.3;
  });

  return (
    <group position={station.position}>
      {/* Base platform */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.3, 8]} />
        <meshStandardMaterial color="#14201c" roughness={0.85} />
      </mesh>
      {/* Workbench surface */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.6, 0.12, 1]} />
        <meshStandardMaterial color="#0f1c18" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Glowing core */}
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#121f1b"
          emissive={station.accent}
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

  const discuss = (title: string) => {
    router.push(`/contact?service=${encodeURIComponent(title)}`);
  };

  return (
    <>
      <SceneCanvas
        cameraPosition={POSES.overview.position}
        cameraFov={44}
        background="#0c0906"
        fog={{ color: "#100c08", density: 0.045 }}
        animate
      >
        <LightRig keyColor="#ffe0b8" fillColor={ACCENT} intensity={0.8} />
        <CameraDirector pose={pose as string} poses={POSES} />

        {/* Forge floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[9, 48]} />
          <meshStandardMaterial color="#120e0a" roughness={0.95} />
        </mesh>
        {/* Central forge pit glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.8, 1.6, 32]} />
          <meshStandardMaterial color="#1a1208" emissive={ACCENT} emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>

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
                    onClick: () => discuss(station.title),
                  },
                  {
                    label: "See all services",
                    href: "/services",
                  },
                ],
              }}
            />
          </group>
        ))}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center px-6 text-center">
        <p className="font-mono text-[0.6rem] tracking-[0.28em] uppercase" style={{ color: ACCENT }}>
          TECHNOLOGY FORGE · SERVICES
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          What I Can Build For You
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Five service stations. Click one to see the problem it solves and what&apos;s included.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 sm:bottom-16 flex flex-wrap justify-center gap-2 px-4">
        {(["overview", "stations", "left", "right"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPose(p)}
            className="panel pointer-events-auto rounded-full px-3 py-1.5 font-mono text-[0.56rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
