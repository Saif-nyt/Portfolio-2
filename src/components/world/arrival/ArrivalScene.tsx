"use client";

import { useCallback, useState } from "react";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions, useWorldState } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useSceneTheme, mixHex } from "@/lib/world/scene-theme";
import { Campsite } from "./Campsite";
import { Forest } from "./Forest";

const ACCENT = "#63f5e7";

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
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color={palette.floor} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[20, 1.2]} />
        <meshStandardMaterial color={palette.floorDeep} emissive={palette.accent(ACCENT)} emissiveIntensity={0.14} />
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
function DistantTemple() {
  const palette = useSceneTheme();
  return (
    <group position={[-6, 0, -4]}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[2.4, 3.6, 2]} />
        <meshStandardMaterial color={palette.stoneDark} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[1.9, 1.6, 4]} />
        <meshStandardMaterial color={palette.stone} emissive={palette.accent("#8fd8ff")} emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 4.5, 0.5]} color="#8fd8ff" intensity={3} distance={6} decay={2} />
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
  const { quality, worldEntry } = useWorldState();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");
  const palette = useSceneTheme({ bg: "#d6ddd0", fog: "#dfe6da" });

  const handlePoseComplete = useCallback(
    (completedPose: string) => {
      if (completedPose === "overview" && worldEntry === "entering") {
        worldActions.completeWorldEntry();
      }
    },
    [worldEntry],
  );

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.entrance.position}
        cameraFov={46}
        background={palette.bg}
        fog={{ color: palette.fog, density: palette.fogDensity }}
        animate
        interactive={worldEntry === "inside"}
      >
        <LightRig fillColor={ACCENT} intensity={0.85} />
        <CameraDirector
          pose={worldEntry === "outside" ? "entrance" : pose}
          poses={POSES}
          reduced={reduced}
          allowSteering={worldEntry === "inside"}
          onPoseComplete={handlePoseComplete}
        />

        {/* The main world gate is deliberately larger than every destination entrance. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 17]}>
          <planeGeometry args={[20, 18]} />
          <meshStandardMaterial color={palette.floor} roughness={0.96} />
        </mesh>
        <TempleEntrance
          position={[0, 0, 17]}
          accent={ACCENT}
          open={worldEntry !== "outside"}
          width={6.2}
          height={6.8}
          scale={1.2}
        />

        <ValleyPath />
        <DistantTemple />
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
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pt-32 pb-28 text-center sm:pt-36">
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
                worldActions.beginWorldEntry();
              }}
              className="btn-primary"
            >
              Enter World
            </button>
          </div>
        </div>
      </div>
      ) : null}
    </SceneScope>
  );
}
