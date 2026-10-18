"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { useProjects } from "@/lib/world/content-hooks";

const ACCENT = "#6bffd0";

const POSES: Record<string, CameraPose> = {
  overview: { position: [0, 2.8, 9.5], lookAt: [0, 1.3, 0] },
  close: { position: [0, 2, 6], lookAt: [0, 1.2, -1] },
  left: { position: [-2.5, 2, 6], lookAt: [-3.5, 1.2, -1] },
  right: { position: [2.5, 2, 6], lookAt: [3.5, 1.2, -1] },
};

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

const PROJECT_ACCENTS = ["#6bffd0", "#8fd8ff", "#b39dff", "#ffd36b", "#ffb36b", "#ff8fb3"];

/**
 * Artifact Vault — Projects. Floating project artifacts on pedestals.
 * Clicking an artifact opens its case-file panel with a link to the full
 * case study route.
 */
export function VaultScene() {
  const router = useRouter();
  const projects = useProjects();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");

  // Arrange up to 6 artifacts in a gentle arc.
  const visible = projects.slice(0, 6);
  const positions: [number, number, number][] = visible.map((_, i) => {
    const t = visible.length === 1 ? 0.5 : i / (visible.length - 1);
    const angle = (t - 0.5) * Math.PI * 0.9;
    return [Math.sin(angle) * 4.2, 0, Math.cos(angle) * -2.2 - 0.5];
  });

  return (
    <>
      <SceneCanvas
        cameraPosition={POSES.overview.position}
        cameraFov={44}
        background="#050e0c"
        fog={{ color: "#061210", density: 0.048 }}
        animate
      >
        <LightRig keyColor="#c8efe6" fillColor={ACCENT} intensity={0.8} />
        <CameraDirector pose={pose as string} poses={POSES} />

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
          const accent = PROJECT_ACCENTS[i % PROJECT_ACCENTS.length];
          const pos = positions[i];
          return (
            <group key={project.slug}>
              <Artifact position={pos} accent={accent} index={i} />
              <Hotspot3D
                position={[pos[0], 1.3, pos[2]]}
                radius={0.8}
                accent={accent}
                object={{
                  id: project.slug,
                  eyebrow: `ARTIFACT ${String(i + 1).padStart(2, "0")} · ${project.categoryLabel ?? project.category}`,
                  title: project.title,
                  body: project.summary,
                  bullets: (project.stack ?? []).slice(0, 5),
                  actions: [
                    {
                      label: "Open case file",
                      onClick: () => router.push(`/work/${project.slug}`),
                    },
                  ],
                }}
              />
            </group>
          );
        })}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center px-6 text-center">
        <p className="font-mono text-[0.6rem] tracking-[0.28em]" style={{ color: ACCENT }}>
          ARTIFACT VAULT · PROJECTS
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          Case Studies From the Field
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Click any artifact to inspect the case file, or browse the full list below.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 sm:bottom-16 flex flex-wrap justify-center gap-2 px-4">
        {(["overview", "close", "left", "right"] as const).map((p) => (
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
