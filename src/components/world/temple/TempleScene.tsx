"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { AmbientMotes } from "@/components/world/AmbientMotes";
import { BioluminescentGrowth } from "@/components/world/BioluminescentGrowth";
import { RiseBeam } from "@/components/world/cinematics";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import {
  CarvedReliefs,
  GlyphOrbit,
  GroundShadow,
  HoloRing,
  Pillar,
  Rubble,
  TempleDoor,
  TempleFloor,
  TempleSteps,
  TempleWalls,
} from "@/components/world/temple/TempleGeometry";
import { worldActions } from "@/lib/world/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useDoorwayEntry } from "@/lib/world/doorway";
import { useSceneTheme } from "@/lib/world/scene-theme";

const ACCENT = "#8fd8ff";
const GROWTH_POSITIONS: Array<[number, number]> = [
  [-5, 5],
  [5, 5],
  [-5, -6],
  [5, -6],
];

const POSES: Record<string, CameraPose> = {
  // Looking at the closed doorway from outside.
  approach: { position: [0, 2.4, 11], lookAt: [0, 2, 0] },
  // Standing in the threshold as doors open.
  threshold: { position: [0, 2.1, 4], lookAt: [0, 1.8, -0.5] },
  // Inside the chamber, facing the archive dais.
  interior: { position: [0, 2.2, -1.7], lookAt: [0, 1.6, -4.5] },
  // Turned toward the philosophy alcove on the left.
  philosophy: { position: [-1.8, 2, -0.5], lookAt: [-4.5, 1.5, -3.5] },
  // Turned toward the journey archive on the right.
  journey: { position: [1.8, 2, -0.5], lookAt: [4.5, 1.5, -3.5] },
};

/**
 * The Ancient Temple — About location. Exterior approach → doorway
 * transition → interior chamber with four interactables:
 * Identity Crystal, Journey Archive, Builder's Philosophy, Exit Portal.
 */
export function TempleScene() {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const palette = useSceneTheme({ bg: "#e1dccb", fog: "#e9e4d4" });
  // The camera pose is *derived* from the doorway state rather than chained
  // through `onPoseComplete` callbacks — a dropped completion event used to
  // strand the visitor on "Entering the temple…" forever.
  //   outside → approach · opening → threshold (wait with the doors) · inside → pose
  const [pose, setPose] = useState<keyof typeof POSES>("interior");
  const doorway = useDoorwayEntry();
  const inside = doorway.entered;
  const activePose = doorway.entered ? pose : doorway.open ? "threshold" : "approach";

  const enterTemple = useCallback(() => {
    if (doorway.open) return;
    doorway.begin();
  }, [doorway]);

  const exitTemple = useCallback(() => {
    doorway.exit();
    // Reset so the next visit always opens on the central dais.
    setPose("interior");
  }, [doorway]);

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.approach.position}
        cameraFov={44}
        background={palette.bg}
        fog={{ color: palette.fog, density: palette.fogDensity }}
        animate
        interactive={inside}
      >
        <LightRig fillColor={ACCENT} intensity={1.35} />
        <CameraDirector
          pose={activePose}
          poses={POSES}
          reduced={reduced}
          allowSteering={inside}
          baseFov={44}
        />
        <DistantHorizon accent={ACCENT} scale={1.15} />
        <AmbientMotes color={palette.mote} radius={5.5} height={4} count={70} size={0.12} />
        <BioluminescentGrowth accent={ACCENT} positions={GROWTH_POSITIONS} />

        {/* Interior fill — lifts the chamber just enough to read the stone,
            the alcoves and the dais without losing the ancient mood. */}
        <ambientLight intensity={palette.ambientIntensity * 0.9} color={palette.ambient} />
        <pointLight position={[0, 3.9, -2]} intensity={12} distance={24} decay={2} color={palette.key} />

        <TempleFloor width={14} depth={16} />
        <TempleWalls />
        <CarvedReliefs />
        <TempleSteps />
        <Rubble origin={[0, 0, 3]} count={14} spread={5} />

        {/* Exterior pillars flanking the approach path */}
        <Pillar position={[-2.6, 0, 7]} height={3.4} accent={ACCENT} variant={1} />
        <Pillar position={[2.6, 0, 7]} height={3.4} accent={ACCENT} variant={2} />
        <Pillar position={[-3.4, 0, 4]} height={3} accent={ACCENT} variant={3} />
        <Pillar position={[3.4, 0, 4]} height={3} accent={ACCENT} variant={4} />

        {/* Interior pillars */}
        <Pillar position={[-4, 0, -3]} height={3.6} accent={ACCENT} variant={5} />
        <Pillar position={[4, 0, -3]} height={3.6} accent={ACCENT} variant={6} />

        {/* The great doorway — the temple's entrance */}
        <TempleDoor open={doorway.open} accent={ACCENT} onOpened={doorway.opened} />
        <pointLight position={[0, 2, 1.2]} intensity={palette.isLight ? 3 : 6} distance={9} decay={2} color={ACCENT} />

        {/* ---------- Interactive objects (interior) ---------- */}
        {/* Consecration light rising from the identity dais */}
        <GroundShadow position={[0, 0.02, -4.2]} size={1.5} opacity={0.3} />
        <RiseBeam position={[0, 0.9, -4.2]} color={ACCENT} radius={0.6} height={2.6} opacity={0.09} speed={0.85} />

        {/* Identity Crystal — central dais */}
        <Hotspot3D
          position={[0, 1.5, -4.2]}
          radius={0.85}
          accent={ACCENT}
          object={{
            id: "identity",
            eyebrow: "IDENTITY CRYSTAL",
            title: "T. M. Saiful Islam",
            body: "Full-stack web developer and digital systems builder. I design and ship modern web applications — from marketing sites and storefronts to dashboards, APIs and measurement pipelines — with a bias toward clarity, performance and things that actually work in production.",
            bullets: [
              "1.5 years building and shipping real web projects",
              "100+ projects delivered",
              "Based in Bangladesh · working with clients worldwide",
            ],
            actions: [
              { label: "Read full story", onClick: () => worldActions.openCodex("about") },
              { label: "Hire me", href: "/contact" },
            ],
          }}
        >
          <HoloRing position={[0, 1.5, -4.2]} radius={0.7} color={ACCENT} />
          <GlyphOrbit center={[0, 1.8, -4.2]} count={5} radius={1.1} color={ACCENT} />
        </Hotspot3D>

        {/* Journey Archive — right alcove */}
        <Hotspot3D
          position={[4, 1.4, -3.2]}
          radius={0.75}
          accent="#6bffd0"
          object={{
            id: "journey",
            eyebrow: "JOURNEY ARCHIVE",
            title: "How I got here",
            body: "I started with WordPress because businesses needed sites that worked — then kept going deeper: JavaScript, React, Next.js, TypeScript, APIs and databases. Every project taught me something about shipping software that survives contact with real users.",
            bullets: [
              "Began with client WordPress & Shopify builds",
              "Moved into full-stack React / Next.js applications",
              "Now focused on product-grade web apps, e-commerce systems and reliable tracking",
            ],
            actions: [{ label: "See my skills", href: "/skills" }],
          }}
        >
          <GroundShadow position={[4, 0.02, -3.2]} size={1.2} />
          <HoloRing position={[4, 1.4, -3.2]} radius={0.6} color="#6bffd0" speed={0.55} />
        </Hotspot3D>

        {/* Builder's Philosophy — left alcove */}
        <Hotspot3D
          position={[-4, 1.4, -3.2]}
          radius={0.75}
          accent="#b39dff"
          object={{
            id: "philosophy",
            eyebrow: "BUILDER'S PHILOSOPHY",
            title: "How I approach the work",
            body: "I treat software as a business tool first and a codebase second. That means understanding the actual goal, choosing the simplest architecture that solves it, and shipping something measurable — not a demo that collapses under real traffic.",
            bullets: [
              "Understand the problem before reaching for a framework",
              "Prefer boring, proven technology over novelty for its own sake",
              "Performance and accessibility are features, not polish",
              "Honest scope and timeline beats optimistic promises",
            ],
            actions: [{ label: "See what I build", href: "/services" }],
          }}
        >
          <GroundShadow position={[-4, 0.02, -3.2]} size={1.2} />
          <HoloRing position={[-4, 1.4, -3.2]} radius={0.6} color="#b39dff" speed={0.55} />
        </Hotspot3D>

        {/* Exit Portal — back toward the entrance */}
        <Hotspot3D
          position={[0, 1.2, 4.5]}
          radius={0.7}
          accent="#63f5e7"
          pulse={0.8}
          object={{
            id: "exit",
            eyebrow: "EXIT PORTAL",
            title: "Return to the world",
            body: "Step back through the doorway and continue exploring Nebula — or jump straight to another location from the star chart.",
            actions: [
              { label: "Open world map", onClick: () => worldActions.toggleMap(true) },
              { label: "Go to Arrival Valley", href: "/" },
            ],
          }}
        >
          <GroundShadow position={[0, 0.02, 4.5]} size={1.2} />
        </Hotspot3D>
      </SceneCanvas>

      {/* ---------- HUD ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em]" style={{ color: "var(--loc-accent-text)" }}>
          ANCIENT TEMPLE · ABOUT
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          The Story Behind the Build
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Approach the doorway, then step inside to meet the identity crystal, journey archive and
          builder&apos;s philosophy.
        </p>
      </div>

      {/* ---------- DOM interaction layer ---------- */}
      {!inside && !doorway.open ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-28 sm:pb-24">
          <button type="button" onClick={enterTemple} className="btn-primary pointer-events-auto">
            Enter the Temple
          </button>
        </div>
      ) : inside ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap items-center justify-center gap-2 px-4 sm:bottom-28">
          <button
            type="button"
            onClick={() => setPose("interior")}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:text-accent"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => setPose("journey")}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:text-accent"
          >
            Journey →
          </button>
          <button
            type="button"
            onClick={() => setPose("philosophy")}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:text-accent"
          >
            ← Philosophy
          </button>
          <button
            type="button"
            onClick={() => {
              exitTemple();
              router.push("/");
            }}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-ink uppercase transition hover:text-accent"
          >
            Exit temple
          </button>
          <Link
            href="/"
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-ink uppercase transition hover:text-accent"
          >
            Arrival Valley
          </Link>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-2 text-center sm:bottom-28">
          <div role="status" className="font-mono text-xs tracking-[0.2em] text-ink uppercase">
            Entering the temple…
          </div>
          <button
            type="button"
            onClick={doorway.skip}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:text-accent"
          >
            Skip wait
          </button>
        </div>
      )}
    </SceneScope>
  );
}
