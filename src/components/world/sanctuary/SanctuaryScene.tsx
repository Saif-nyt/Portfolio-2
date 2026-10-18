"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { useArticles } from "@/lib/world/content-hooks";
import { worldActions } from "@/lib/world/store";

const ACCENT = "#ffd36b";

const POSES: Record<string, CameraPose> = {
  overview: { position: [0, 2.8, 9], lookAt: [0, 1.4, 0] },
  close: { position: [0, 2, 5.5], lookAt: [0, 1.3, -1] },
  left: { position: [-2.2, 2, 5.5], lookAt: [-3, 1.3, -1] },
  right: { position: [2.2, 2, 5.5], lookAt: [3, 1.3, -1] },
};

/** A floating data tablet. */
function DataTablet({
  position,
  accent,
  index,
}: {
  position: [number, number, number];
  accent: string;
  index: number;
}) {
  return (
    <group position={position} rotation={[0, (index - 2) * -0.15, 0]}>
      {/* Tablet slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 1.2, 0.06]} />
        <meshStandardMaterial color="#141a14" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Glowing screen face */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[0.78, 1.05]} />
        <meshStandardMaterial
          color="#0d1f18"
          emissive={accent}
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0.2, 0.4]} color={accent} intensity={2.2} distance={3.5} decay={2} />
    </group>
  );
}

const ARTICLE_ACCENTS = ["#ffd36b", "#8fd8ff", "#6bffd0", "#b39dff", "#ffb36b", "#ff8fb3"];

/**
 * Knowledge Sanctuary — Insights. Floating data tablets in a library-like
 * chamber. Clicking a tablet opens a preview panel with a "Read Article"
 * action that routes to the full reading interface.
 */
export function SanctuaryScene() {
  const router = useRouter();
  const articles = useArticles();
  const [pose, setPose] = useState<keyof typeof POSES>("overview");

  const visible = articles.slice(0, 6);
  const positions: [number, number, number][] = visible.map((_, i) => {
    const t = visible.length === 1 ? 0.5 : i / (visible.length - 1);
    const angle = (t - 0.5) * Math.PI * 0.85;
    return [Math.sin(angle) * 3.8, 1.4 + (i % 2) * 0.3, Math.cos(angle) * -1.8 - 0.8];
  });

  return (
    <>
      <SceneCanvas
        cameraPosition={POSES.overview.position}
        cameraFov={44}
        background="#0b0906"
        fog={{ color: "#0e0c08", density: 0.048 }}
        animate
      >
        <LightRig keyColor="#f0e0c0" fillColor={ACCENT} intensity={0.78} />
        <CameraDirector pose={pose as string} poses={POSES} />

        {/* Sanctuary floor with concentric rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, 48]} />
          <meshStandardMaterial color="#12100a" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1, 1.4, 40]} />
          <meshStandardMaterial color="#1a160c" emissive={ACCENT} emissiveIntensity={0.35} side={2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[2.2, 2.5, 40]} />
          <meshStandardMaterial color="#1a160c" emissive={ACCENT} emissiveIntensity={0.2} side={2} />
        </mesh>

        {visible.map((article, i) => {
          const accent = ARTICLE_ACCENTS[i % ARTICLE_ACCENTS.length];
          const pos = positions[i];
          const excerpt =
            article.excerpt ?? article.summary ?? article.description ?? "A field note from real project work.";
          return (
            <group key={article.slug}>
              <DataTablet position={pos} accent={accent} index={i} />
              <Hotspot3D
                position={[pos[0], pos[1], pos[2] + 0.3]}
                radius={0.7}
                accent={accent}
                object={{
                  id: article.slug,
                  eyebrow: `DATA TABLET · ${String(i + 1).padStart(2, "0")}`,
                  title: article.title,
                  body: excerpt.length > 220 ? `${excerpt.slice(0, 217)}…` : excerpt,
                  actions: [
                    {
                      label: "Read Article",
                      onClick: () => router.push(`/insights/${article.slug}`),
                    },
                    {
                      label: "Browse all field notes",
                      onClick: () => worldActions.openCodex("insights"),
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
          KNOWLEDGE SANCTUARY · INSIGHTS
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          Field Notes & Research
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Click a tablet to preview an article, then open the full reading view.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap justify-center gap-2 px-4 sm:bottom-28">
        {(["overview", "close", "left", "right"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPose(p)}
            className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.56rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
