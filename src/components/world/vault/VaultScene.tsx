"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { useProjectsResource, type ProjectSummary } from "@/lib/world/content-hooks";
import { worldActions } from "@/lib/world/store";
import { useMediaQuery } from "@/lib/hooks";
import { PROJECT_KIND_LABELS } from "@/data/projects";

const ACCENT = "#6bffd0";

const PROJECT_ACCENTS = ["#6bffd0", "#8fd8ff", "#b39dff", "#ffd36b", "#ffb36b", "#ff8fb3"];
/** Named accents from the project schema → vault crystal colours. */
const ACCENT_BY_NAME: Record<string, string> = {
  cyan: "#6bffd0",
  turquoise: "#8fd8ff",
  mist: "#b39dff",
};

type PoseId = "overview" | "close" | "left" | "right";

/** A floating artifact pedestal with a rotating crystal above it. */
function Artifact({
  position,
  accent,
  index,
}: {
  position: [number, number, number];
  accent: string;
  index: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.3, 8]} />
        <meshStandardMaterial color="#0f1f1b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0, index * 0.7, 0.2]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color="#0d2420"
          emissive={accent}
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 1, 0]} color={accent} intensity={3} distance={4} decay={2} />
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
  if (project.stack && project.stack.length > 0) {
    bullets.push(`Stack · ${project.stack.slice(0, 5).join(", ")}`);
  }
  if (project.tools && project.tools.length > 0) {
    bullets.push(`Engines · ${project.tools.slice(0, 5).join(", ")}`);
  }
  bullets.push(
    project.results
      ? `Outcome · ${project.results}`
      : "Outcome · Verified results pending review",
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
  const [pose, setPose] = useState<PoseId>("overview");
  // Portrait phones can't fit the wide desktop arc — tighten it and pull the
  // camera back so every artifact stays on screen.
  const portrait = useMediaQuery("(max-aspect-ratio: 1/1)");

  const visible = useMemo(() => projects.slice(0, 6), [projects]);
  const count = visible.length;

  const positions = useMemo<[number, number, number][]>(() => {
    if (count === 0) return [];
    const radius = portrait ? 2.6 : 4.2;
    const spread = portrait ? Math.PI * 0.8 : Math.PI * 0.9;
    const depth = portrait ? 1.4 : 2.2;
    const baseZ = portrait ? -0.2 : -0.5;
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
            overview: { position: [0, 2.4, 13.5], lookAt: [0, 1.1, -1] },
            close: { position: [0, 2.0, 9.5], lookAt: [0, 1.1, -1] },
            left: { position: [-2.6, 2.1, 10.5], lookAt: [-2.2, 1.1, -1] },
            right: { position: [2.6, 2.1, 10.5], lookAt: [2.2, 1.1, -1] },
          }
        : {
            overview: { position: [0, 2.8, 9.5], lookAt: [0, 1.3, 0] },
            close: { position: [0, 2, 6], lookAt: [0, 1.2, -1] },
            left: { position: [-2.5, 2, 6], lookAt: [-3.5, 1.2, -1] },
            right: { position: [2.5, 2, 6], lookAt: [3.5, 1.2, -1] },
          },
    [portrait],
  );

  const hasArtifacts = status === "ready" && count > 0;

  return (
    <>
      <SceneCanvas
        cameraPosition={POSE_STATES.overview.position}
        cameraFov={44}
        background="#050e0c"
        fog={{ color: "#061210", density: 0.048 }}
        animate
      >
        <LightRig keyColor="#c8efe6" fillColor={ACCENT} intensity={0.8} />
        <CameraDirector pose={pose as string} poses={POSE_STATES} />

        {/* Vault floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[9, 48]} />
          <meshStandardMaterial color="#0a1614" roughness={0.95} />
        </mesh>
        {/* Central vault ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.2, 2.4, 40]} />
          <meshStandardMaterial
            color="#0c1f1b"
            emissive={ACCENT}
            emissiveIntensity={0.3}
            side={2}
          />
        </mesh>

        {visible.map((project, i) => {
          const accent =
            (project.accent && ACCENT_BY_NAME[project.accent]) ||
            PROJECT_ACCENTS[i % PROJECT_ACCENTS.length];
          const pos = positions[i];
          return (
            <group key={project.slug}>
              <Artifact position={pos} accent={accent} index={i} />
              <Hotspot3D
                position={[pos[0], 1.3, pos[2]]}
                radius={0.8}
                accent={accent}
                object={{
                  ...artifactDetails(project, i),
                  actions: [
                    {
                      label: "Open case file",
                      onClick: () => router.push(`/work/${project.slug}`),
                    },
                    {
                      label: "Browse all projects",
                      onClick: () => worldActions.openCodex("work"),
                    },
                  ],
                }}
              />
            </group>
          );
        })}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em]" style={{ color: ACCENT }}>
          ARTIFACT VAULT · PROJECTS
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          Case Studies From the Field
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
            {count} artifact{count === 1 ? "" : "s"} catalogued — tap one to inspect its case file.
          </p>
        )}
      </div>

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
      </div>
    </>
  );
}
