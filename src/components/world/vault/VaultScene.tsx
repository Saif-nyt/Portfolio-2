"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { EntrancePrompt } from "@/components/world/EntrancePrompt";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { AmbientMotes } from "@/components/world/AmbientMotes";
import { BioluminescentGrowth } from "@/components/world/BioluminescentGrowth";
import { Floater } from "@/components/world/cinematics";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { useProjectsResource, type ProjectSummary } from "@/lib/world/content-hooks";
import { artifactFrom } from "@/lib/world/artifacts";
import { progressActions, useProgress } from "@/lib/world/progress";
import { worldActions } from "@/lib/world/store";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { useDoorwayEntry } from "@/lib/world/doorway";
import { useSceneTheme } from "@/lib/world/scene-theme";
import { mixHex } from "@/lib/world/scene-theme";
import { createRimGlowMaterial, glowDamp } from "@/lib/world/crisp-glow";
import { requestWorldFrame } from "@/lib/world/render-loop";
import { PROJECT_KIND_LABELS } from "@/data/projects";

const ACCENT = "#6bffd0";
const GROWTH_POSITIONS: Array<[number, number]> = [
  [-7, -4],
  [-4, 5],
  [4, 5],
  [7, -4],
];

type PoseId = "overview" | "close" | "left" | "right";

/**
 * A floating artifact pedestal with a rotating crystal above it. The crystal
 * glows through a tightly-contained Fresnel rim (see `crisp-glow`) — luminous
 * at the silhouette, crisp at any camera distance, never a hazy halo. Hover
 * (via the shared `hoveredRef` written by the sibling Hotspot3D) eases the
 * glow brighter; leaving eases it smoothly back to idle.
 */
function Artifact({
  position,
  accent,
  index,
  collected = false,
  shape = "artifact",
  hoveredRef,
}: {
  position: [number, number, number];
  accent: string;
  index: number;
  collected?: boolean;
  shape?: "shard" | "artifact" | "relic";
  /** Index of the currently-hovered artifact, or -1. Shared ref: no re-renders. */
  hoveredRef?: { current: number };
}) {
  const palette = useSceneTheme();
  const reduced = usePrefersReducedMotion();
  const glow = palette.accent(accent);
  const crystalColor = mixHex(palette.metal, glow, collected ? 0.35 : 0.2);
  const shapeRoughness = shape === "relic" ? 0.22 : shape === "shard" ? 0.25 : 0.24;
  const shapeMetalness = shape === "relic" ? 0.35 : shape === "shard" ? 0.2 : 0.3;

  const crystalGlow = useMemo(
    () =>
      createRimGlowMaterial({
        color: crystalColor,
        emissive: glow,
        emissiveIntensity: 0.55,
        rimStrength: 0.55,
        rimPower: 3.2,
        roughness: shapeRoughness,
        metalness: shapeMetalness,
        flatShading: true,
      }),
    [crystalColor, glow, shapeRoughness, shapeMetalness],
  );
  const bandGlow = useMemo(
    () =>
      createRimGlowMaterial({
        color: glow,
        emissive: glow,
        emissiveIntensity: 0.45,
        rimStrength: 0.3,
        rimPower: 2.6,
        roughness: 0.4,
        metalness: 0.1,
      }),
    [glow],
  );

  useEffect(
    () => () => {
      crystalGlow.material.dispose();
      bandGlow.material.dispose();
    },
    [crystalGlow, bandGlow],
  );

  const hoverMix = useRef(0);

  useFrame(({ clock }, delta) => {
    const target = hoveredRef?.current === index ? 1 : 0;
    hoverMix.current = reduced ? target : glowDamp(hoverMix.current, target, delta, 12);
    const mix = hoverMix.current;
    const collectedBoost = collected ? 0.12 : 0;
    const t = clock.elapsedTime;

    // Idle: subtle refined glow. Hover: brighter body + a more defined rim
    // (stronger, not wider). Collected artifacts keep a permanent faint lift.
    crystalGlow.setGlow(
      (0.55 + collectedBoost + mix * 0.45 + (reduced ? 0 : Math.sin(t * 1.5 + index) * 0.03)) * palette.glow,
      (0.55 + mix * 0.4) * palette.glow,
    );
    bandGlow.setGlow((0.45 + mix * 0.35) * palette.glow, (0.3 + mix * 0.2) * palette.glow);

    if (Math.abs(target - mix) > 1e-3) requestWorldFrame();
  });

  return (
    <group position={position}>
      {/* Stacked stone plinth with a carved band */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.78, 0.24, 8]} />
        <meshStandardMaterial color={palette.plinth} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.58, 0.16, 8]} />
        <meshStandardMaterial color={palette.stone} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={bandGlow.material}>
        <torusGeometry args={[0.42, 0.03, 6, 16]} />
      </mesh>
      <Floater amplitude={0.09} speed={0.7} phase={index * 1.3} spin={0.45 + index * 0.08}>
        <group position={[0, 0.95, 0]} rotation={[0, index * 0.7, 0.2]}>
          {shape === "relic" ? (
            <mesh material={crystalGlow.material}>
              <icosahedronGeometry args={[0.42, 0]} />
            </mesh>
          ) : shape === "shard" ? (
            <mesh material={crystalGlow.material}>
              <octahedronGeometry args={[0.4, 0]} />
            </mesh>
          ) : (
            <mesh material={crystalGlow.material}>
              <dodecahedronGeometry args={[0.38, 0]} />
            </mesh>
          )}
        </group>
      </Floater>
    </group>
  );
}

function kindLabel(project: ProjectSummary): string {
  const kind = project.kind as keyof typeof PROJECT_KIND_LABELS | undefined;
  return kind ? PROJECT_KIND_LABELS[kind] : "Case Study";
}

/**
 * Build the case-file contents for one artifact. Every field is either real
 * project data or an explicit "pending" note — nothing is invented.
 */
function artifactDetails(project: ProjectSummary, i: number) {
  const bullets: string[] = [
    `Reference ART-${String(i + 1).padStart(2, "0")} · ${kindLabel(project)}`,
    `Discipline · ${project.categoryLabel ?? project.category}`,
  ];
  if (project.role) {
    bullets.push(`Role · ${project.role}`);
  }
  if (project.problem) {
    bullets.push(`Problem · ${project.problem}`);
  }
  if (project.stack && project.stack.length > 0) {
    bullets.push(`Stack · ${project.stack.slice(0, 5).join(", ")}`);
  }
  if (project.tools && project.tools.length > 0) {
    bullets.push(`Engines · ${project.tools.slice(0, 5).join(", ")}`);
  }
  bullets.push(
    project.results
      ? `Outcome · ${project.results}`
      : "Outcome · Not yet published",
  );

  return {
    id: project.slug,
    eyebrow: `ARTIFACT ${String(i + 1).padStart(2, "0")} · ${project.categoryLabel ?? project.category}`,
    title: project.title,
    body: project.summary,
    bullets,
  };
}

/**
 * Artifact Vault — Projects. Floating project artifacts on pedestals.
 * Clicking an artifact opens its case-file panel with a link to the full
 * case study route; the artifact index opens the full, filterable list.
 */
export function VaultScene() {
  const router = useRouter();
  const { status, data: projects, reload } = useProjectsResource();
  const progress = useProgress();
  const [pose, setPose] = useState<PoseId>("overview");
  // Index of the artifact under the pointer, or -1. A ref (not state): hover
  // crosses must never re-render the scene tree — each Artifact's own useFrame
  // reads this and eases its glow materials toward the right level.
  const hoveredArtifact = useRef(-1);
  // The camera only crosses the threshold once the leaves have parted (or the
  // visitor skips the wait), so it can never be stranded inside the doorway.
  const doorway = useDoorwayEntry();
  const { entered: inside } = doorway;
  // Portrait phones show a much narrower slice of the world: the artifacts
  // open into a true half circle and the camera sits deeper in the room so
  // nothing overlaps.
  const portrait = useMediaQuery("(max-aspect-ratio: 1/1)");
  const palette = useSceneTheme({ bg: "#dbddcd", fog: "#e5e7d8" });

  const visible = useMemo(() => projects.slice(0, 6), [projects]);
  const count = visible.length;

  const positions = useMemo<[number, number, number][]>(() => {
    if (count === 0) return [];
    // The plinths are 1.56 wide, so the centre-to-centre gap has to stay
    // above ~1.9 or the pedestals interpenetrate. The desktop arc keeps its
    // authored sweep; the portrait arc widens to a half circle and sits
    // further back from the doorway to buy that room.
    const radius = portrait ? 3.1 : 4.2;
    const spread = portrait ? Math.PI : Math.PI * 0.9;
    const depth = portrait ? 3.1 : 2.2;
    const baseZ = portrait ? -1.0 : -0.5;
    return visible.map((_, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = (t - 0.5) * spread;
      return [Math.sin(angle) * radius, 0, Math.cos(angle) * -depth + baseZ];
    });
  }, [count, visible, portrait]);

  const POSE_STATES: Record<string, CameraPose> = useMemo(
    () =>
      portrait
        ? {
            entrance: { position: [0, 2.8, 17], lookAt: [0, 2.8, 13] },
            overview: { position: [0, 3.0, 10], lookAt: [0, 1.1, -2] },
            close: { position: [0, 2.2, 6.2], lookAt: [0, 1.15, -2.6] },
            left: { position: [-3.2, 2.3, 7.4], lookAt: [-2.4, 1.1, -2.2] },
            right: { position: [3.2, 2.3, 7.4], lookAt: [2.4, 1.1, -2.2] },
          }
        : {
            entrance: { position: [0, 2.8, 17], lookAt: [0, 2.8, 13] },
            overview: { position: [0, 2.8, 9.5], lookAt: [0, 1.3, 0] },
            close: { position: [0, 2, 6], lookAt: [0, 1.2, -1] },
            left: { position: [-2.5, 2, 6], lookAt: [-3.5, 1.2, -1] },
            right: { position: [2.5, 2, 6], lookAt: [3.5, 1.2, -1] },
          },
    [portrait],
  );

  // Every visit starts from the framed overview, and repeated taps on the
  // Enter button are ignored while the door is already swinging.
  const enterVault = useCallback(() => {
    if (doorway.open) return;
    setPose("overview");
    doorway.begin();
  }, [doorway]);

  const exitVault = useCallback(() => {
    doorway.exit();
    setPose("overview");
  }, [doorway]);

  const hasArtifacts = status === "ready" && count > 0;
  const caseFileFor = (project: ProjectSummary, index: number, rarity: "shard" | "artifact" | "relic") => ({
    ...artifactDetails(project, index),
    actions: [
      ...(progress.collected.includes(project.slug)
        ? []
        : [
            {
              label: `Collect · ${rarity}`,
              onClick: () => progressActions.collect(project.slug, rarity),
            },
          ]),
      {
        label: "Open case file",
        onClick: () => router.push(`/work/${project.slug}`),
      },
      {
        label: "Browse all projects",
        onClick: () => worldActions.openCodex("work"),
      },
    ],
  });

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSE_STATES.entrance.position}
        cameraFov={44}
        background={palette.bg}
        fog={{ color: palette.fog, density: palette.fogDensity }}
        animate={doorway.open}
      >
        <LightRig fillColor={ACCENT} intensity={0.8} />
        <CameraDirector
          pose={inside ? (pose as string) : "entrance"}
          poses={POSE_STATES}
          baseFov={44}
        />
        <DistantHorizon accent={ACCENT} scale={1.2} />
        <AmbientMotes color={palette.mote} radius={6.5} height={3.8} count={48} size={0.1} />
        <BioluminescentGrowth accent={ACCENT} positions={GROWTH_POSITIONS} />

        {/* The temple entrance into the vault */}
        <TempleEntrance
          position={[0, 0, 13]}
          accent={ACCENT}
          open={doorway.open}
          onOpened={doorway.opened}
        />

        {/* Vault floor — sized to hold the widened portrait arc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[portrait ? 11.5 : 9, portrait ? 56 : 48]} />
          <meshStandardMaterial color={palette.floor} roughness={0.95} />
        </mesh>
        {/* Central vault ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.2, 2.4, 40]} />
          <meshStandardMaterial
            color={palette.stoneDark}
            emissive={palette.accent(ACCENT)}
            emissiveIntensity={0.3}
            side={2}
          />
        </mesh>

        {visible.map((project, i) => {
          const artifact = artifactFrom(project, i);
          const accent = artifact.accent;
          const collected = progress.collected.includes(artifact.id);
          const pos = positions[i];
          return (
            <group key={project.slug}>
              <Artifact
                position={pos}
                accent={accent}
                index={i}
                collected={collected}
                shape={artifact.rarity}
                hoveredRef={hoveredArtifact}
              />
              <Hotspot3D
                position={[pos[0], 1.3, pos[2]]}
                // Fingers are less precise than a cursor; portrait framing also
                // puts the pedestals further from the camera.
                radius={portrait ? 1.05 : 0.8}
                accent={accent}
                object={caseFileFor(project, i, artifact.rarity)}
                showIndicator={false}
                onHoverChange={(hovered) => {
                  if (hovered) {
                    hoveredArtifact.current = i;
                  } else if (hoveredArtifact.current === i) {
                    // Only clear our own slot: a fast move to the next
                    // artifact may deliver "out" after the next "over".
                    hoveredArtifact.current = -1;
                  }
                }}
              />
            </group>
          );
        })}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em]" style={{ color: "var(--loc-accent-text)" }}>
          ARTIFACT VAULT · PROJECTS
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          Selected Work, Preserved in the Vault
        </h1>
        {status === "loading" ? (
          <p className="mt-2 max-w-md text-sm text-dim" role="status">
            Retrieving artifacts from the vault…
          </p>
        ) : status === "error" ? (
          <div className="pointer-events-auto mt-3 flex flex-col items-center gap-3">
            <p className="max-w-xs text-sm text-dim" role="alert">
              The artifact archive is offline right now — the catalogued work is temporarily
              unreachable.
            </p>
            <button
              type="button"
              onClick={reload}
              className="panel rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.18em] text-accent uppercase"
            >
              Retry archive
            </button>
          </div>
        ) : count === 0 ? (
          <p className="mt-2 max-w-md text-sm text-dim" role="status">
            No artifacts have been catalogued yet. Check back soon.
          </p>
        ) : (
          <p className="mt-2 max-w-md text-sm text-dim">
            {count} case {count === 1 ? "study" : "studies"} · choose a project to explore its build story.
          </p>
        )}
      </div>

      <EntrancePrompt
        label="the Vault"
        open={doorway.open}
        opening={doorway.opening}
        onEnter={enterVault}
        onSkip={doorway.skip}
      />

      {inside ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap items-center justify-center gap-2 px-4 sm:bottom-28">
          {hasArtifacts
            ? (["overview", "close", "left", "right"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPose(p)}
                  className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
                >
                  {p}
                </button>
              ))
            : null}
          {hasArtifacts ? (
            <button
              type="button"
              onClick={() => worldActions.openCodex("work")}
              className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.16em] uppercase transition hover:text-accent"
              style={{ color: ACCENT }}
            >
              Artifact index
            </button>
          ) : null}
          <button
            type="button"
            onClick={exitVault}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.16em] text-ink uppercase transition hover:text-accent"
          >
            Exit temple
          </button>
          <Link
            href="/"
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.16em] text-ink uppercase transition hover:text-accent"
          >
            Arrival Valley
          </Link>
        </div>
      ) : null}
    </SceneScope>
  );
}
