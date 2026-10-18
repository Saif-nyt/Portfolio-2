"use client";

import Link from "next/link";
import { useState } from "react";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";

const ACCENT = "#63f5e7";

const POSES: Record<string, CameraPose> = {
  overview: { position: [0, 3.2, 10], lookAt: [0, 1.2, 0] },
  map: { position: [0, 2.2, 6.5], lookAt: [0, 1, 0] },
  temple: { position: [-2.5, 2, 5], lookAt: [-5, 1.5, 2] },
  vault: { position: [2.8, 2, 5], lookAt: [5.5, 1.2, 1] },
  beacon: { position: [0, 2.4, 4], lookAt: [0, 1.8, 0] },
};

/** Glowing path strip on the valley floor. */
function ValleyPath() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color="#0a1815" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[20, 1.4]} />
        <meshStandardMaterial color="#0d2420" emissive={ACCENT} emissiveIntensity={0.3} />
      </mesh>
    </group>
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
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[1.2, 1.8, 6]} />
        <meshStandardMaterial color="#0f2622" roughness={1} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.9, 1, 6]} />
        <meshStandardMaterial color="#0a1a17" emissive={ACCENT} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** The distant temple silhouette visible from the valley. */
function DistantTemple() {
  return (
    <group position={[-6, 0, -4]}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[2.4, 3.6, 2]} />
        <meshStandardMaterial color="#0c1e1b" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[1.9, 1.6, 4]} />
        <meshStandardMaterial color="#0a1916" emissive="#8fd8ff" emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 4.5, 0.5]} color="#8fd8ff" intensity={3} distance={6} decay={2} />
    </group>
  );
}

/** Central illuminated map pedestal. */
function MapPedestal() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 1, 8]} />
        <meshStandardMaterial color="#10221f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 8]} />
        <meshStandardMaterial color="#0d2824" emissive={ACCENT} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color={ACCENT} intensity={4} distance={5} decay={2} />
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
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.3 - 0.3, 0.3 + i * 0.12, i * 0.15 - 0.15]} rotation={[0.2 * i, i, 0.1]}>
          <octahedronGeometry args={[0.18 - i * 0.03, 0]} />
          <meshStandardMaterial color="#0d2f2a" emissive={color} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={2.5} distance={3.5} decay={2} />
    </group>
  );
}

/**
 * Arrival Valley — Home. A lightweight alien landscape with a glowing path,
 * distant floating islands, a temple on the horizon, interactive crystals,
 * and a central map pedestal that opens the star chart.
 */
export function ArrivalScene() {
  const reduced = usePrefersReducedMotion();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");

  return (
    <>
      <SceneCanvas
        cameraPosition={POSES.overview.position}
        cameraFov={46}
        background="#050d0c"
        fog={{ color: "#07110f", density: 0.04 }}
        animate
      >
        <LightRig keyColor="#cfeee8" fillColor={ACCENT} intensity={0.85} />
        <CameraDirector pose={pose as string} poses={POSES} reduced={reduced} />

        <ValleyPath />
        <DistantTemple />
        <MapPedestal />

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

        {/* Temple beacon → About */}
        <Hotspot3D
          position={[-6, 3.2, -4]}
          radius={1}
          accent="#8fd8ff"
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

      {/* Hero copy overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[0.62rem] tracking-[0.3em] text-accent uppercase">
          NEBULA · THE DIGITAL FRONTIER
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-3xl leading-[1.1] text-ink sm:text-5xl">
          Building Digital Experiences Beyond the Ordinary.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-dim sm:text-base">
          I&apos;m Saiful — a full-stack web developer building modern websites, applications and
          digital systems.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="panel rounded-full px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.16em] text-dim uppercase">
            100+ sites shipped
          </span>
          <span className="panel rounded-full px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.16em] text-dim uppercase">
            1.5 years experience
          </span>
        </div>
        <div className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setPose("map");
              worldActions.toggleMap(true);
            }}
            className="btn-primary"
          >
            Explore the World
          </button>
          <Link href="/work" className="btn-ghost">
            Discover My Work
          </Link>
          <Link href="/contact" className="btn-ghost">
            Hire Me
          </Link>
        </div>
      </div>
    </>
  );
}
