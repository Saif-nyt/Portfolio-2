"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { DistantHorizon } from "@/components/world/DistantHorizon";
import { EntrancePrompt } from "@/components/world/EntrancePrompt";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { AmbientMotes } from "@/components/world/AmbientMotes";
import { BioluminescentGrowth } from "@/components/world/BioluminescentGrowth";
import { Floater, OrbitRing, RiseBeam } from "@/components/world/cinematics";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { useProjectsResource, type ProjectSummary } from "@/lib/world/content-hooks";
import { artifactFrom } from "@/lib/world/artifacts";
import { progressActions, useProgress } from "@/lib/world/progress";
import { worldActions } from "@/lib/world/store";
import { useMediaQuery } from "@/lib/hooks";
import { useDoorwayEntry } from "@/lib/world/doorway";
import { useSceneTheme } from "@/lib/world/scene-theme";
import { mixHex } from "@/lib/world/scene-theme";
import { PROJECT_KIND_LABELS } from "@/data/projects";

const ACCENT = "#6bffd0";
const GROWTH_POSITIONS: Array<[number, number]> = [
  [-7, -4],
  [-4, 5],
  [4, 5],
  [7, -4],
];

type PoseId = "overview" | "close" | "left" | "right";

/** A floating artifact pedestal with a rotating crystal above it. */
function Artifact({
  position,
  accent,
  index,
  collected = false,
  shape = "artifact",
}: {
  position: [number, number, number];
  accent: string;
  index: number;
  collected?: boolean;
  shape?: "shard" | "artifact" | "relic";
}) {
  const palette = useSceneTheme();
  const glow = palette.accent(accent);
  const crystalColor = mixHex(palette.metal, glow, collected ? 0.35 : 0.2);
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
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.42, 0.03, 6, 16]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.9 * palette.glow} toneMapped={false} />
      </mesh>
      {/* Containment beam rising from the pedestal */}
      <RiseBeam position={[0, 0.4, 0]} color={accent} radius={0.5} height={2.0} opacity={0.08} speed={1 + index * 0.12} />
      {/* Orbiting scan ring around the crystal — brighter once collected */}
      <OrbitRing
        position={[0, 0.95, 0]}
        radius={0.64}
        color={accent}
        speed={0.5 + index * 0.06}
        tilt={Math.PI / 2.4}
        opacity={collected ? 0.85 : 0.5}
      />
      <Floater amplitude={0.09} speed={0.7} phase={index * 1.3} spin={0.45 + index * 0.08}>
        <group position={[0, 0.95, 0]} rotation={[0, index * 0.7, 0.2]}>
          {shape === "relic" ? (
            <mesh>
              <icosahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial
                color={crystalColor}
                emissive={glow}
                emissiveIntensity={(collected ? 1.9 : 1.3) * palette.glow}
                roughness={0.22}
                metalness={0.35}
                flatShading
                toneMapped={false}
              />
            </mesh>
          ) : shape === "shard" ? (
            <mesh>
              <octahedronGeometry args={[0.4, 0]} />
              <meshStandardMaterial
                color={crystalColor}
                emissive={glow}
                emissiveIntensity={(collected ? 2.2 : 1.6) * palette.glow}
                roughness={0.25}
                metalness={0.2}
                flatShading
                toneMapped={false}
              />
            </mesh>
          ) : (
            <mesh>
              <dodecahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial
                color={crystalColor}
                emissive={glow}
                emissiveIntensity={(collected ? 2.0 : 1.5) * palette.glow}
                roughness={0.24}
                metalness={0.3}
                flatShading
                toneMapped={false}
              />
            </mesh>
          )}
          {/* Inner light core */}
          <mesh scale={0.45}>
            <icosahedronGeometry args={[0.4, 1]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.4 * palette.glow} toneMapped={false} />
          </mesh>
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
              <Artifact position={pos} accent={accent} index={i} collected={collected} shape={artifact.rarity} />
              <Hotspot3D
                position={[pos[0], 1.3, pos[2]]}
                // Fingers are less precise than a cursor; portrait framing also
                // puts the pedestals further from the camera.
                radius={portrait ? 1.05 : 0.8}
                accent={accent}
                object={caseFileFor(project, i, artifact.rarity)}
                showIndicator={false}
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
        {hasArtifacts ? (
          <nav
            aria-label="Featured case studies"
            className="pointer-events-auto mt-4 flex w-full max-w-4xl gap-2 overflow-x-auto px-1 pb-2 text-left sm:mt-5"
          >
            {visible.map((project, i) => {
              const artifact = artifactFrom(project, i);
              const collected = progress.collected.includes(artifact.id);
              return (
                <button
                  key={project.slug}
                  type="button"
                  aria-label={`Inspect ${project.title} case file`}
                  onClick={() => worldActions.openPanel(caseFileFor(project, i, artifact.rarity))}
                  className="panel flex min-h-[5.25rem] w-48 shrink-0 flex-col items-start justify-center gap-1 rounded-xl px-3.5 py-2.5 text-left transition hover:-translate-y-0.5"
                  style={{ borderColor: `${artifact.accent}66` }}
                >
                  <span className="font-mono text-[0.55rem] tracking-[0.16em] uppercase" style={{ color: artifact.accent }}>
                    {artifact.reference} · {artifact.classLabel}
                  </span>
                  <span className="line-clamp-1 text-sm font-medium text-ink">{project.title}</span>
                  <span className="font-mono text-[0.5rem] tracking-[0.14em] text-faint uppercase">
                    {collected ? "Collected" : `${artifact.rarity} · inspect`}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : null}
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
