"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { SceneScope } from "@/components/world/SceneScope";
import { EntrancePrompt } from "@/components/world/EntrancePrompt";
import { TempleEntrance } from "@/components/world/TempleEntrance";
import { AmbientMotes } from "@/components/world/AmbientMotes";
import { OrbitRing, RiseBeam } from "@/components/world/cinematics";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions } from "@/lib/world/store";
import { useSceneTheme } from "@/lib/world/scene-theme";

const ACCENT = "#b39dff";

const POSES: Record<string, CameraPose> = {
  entrance: { position: [0, 2.6, 16.5], lookAt: [0, 2.6, 11.5] },
  overview: { position: [0, 2.6, 9.5], lookAt: [0, 1.4, 0] },
  core: { position: [0, 2, 6], lookAt: [0, 1.4, 0] },
  left: { position: [-2, 2, 5.5], lookAt: [-3.5, 1.4, -1] },
  right: { position: [2, 2, 5.5], lookAt: [3.5, 1.4, -1] },
};

interface SkillNode {
  id: string;
  name: string;
  position: [number, number, number];
  accent: string;
  group: "core" | "backend" | "tools";
  panel: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
  };
}

const NODES: SkillNode[] = [
  {
    id: "nextjs",
    name: "Next.js",
    position: [0, 2.4, -1],
    accent: "#63f5e7",
    group: "core",
    panel: {
      eyebrow: "CORE · FRAMEWORK",
      title: "Next.js",
      body: "My primary framework for production web applications — routing, server components, API routes, data fetching and deployment in one coherent system.",
      bullets: [
        "App Router with server and client components",
        "Route handlers for backend endpoints",
        "Static + incremental rendering for performance",
        "Image, font and script optimization built in",
      ],
    },
  },
  {
    id: "react",
    name: "React",
    position: [-2.2, 1.8, -0.5],
    accent: "#8fd8ff",
    group: "core",
    panel: {
      eyebrow: "CORE · LIBRARY",
      title: "React",
      body: "Component-driven interfaces with predictable state, hooks and composition patterns that scale from landing pages to complex applications.",
      bullets: [
        "Hooks, context and composition patterns",
        "Accessible, semantic component APIs",
        "Performance-conscious re-render control",
      ],
    },
  },
  {
    id: "typescript",
    name: "TypeScript",
    position: [2.2, 1.8, -0.5],
    accent: "#6bffd0",
    group: "core",
    panel: {
      eyebrow: "CORE · LANGUAGE",
      title: "TypeScript",
      body: "Typed JavaScript for safer refactors, clearer APIs and codebases that stay maintainable as teams and features grow.",
      bullets: [
        "Strict typing across application layers",
        "Shared types between frontend and API",
        "Editor tooling that catches bugs before runtime",
      ],
    },
  },
  {
    id: "javascript",
    name: "JavaScript",
    position: [-1.4, 1.2, 0.8],
    accent: "#ffd36b",
    group: "core",
    panel: {
      eyebrow: "CORE · LANGUAGE",
      title: "JavaScript",
      body: "The foundation — modern ES patterns, async flows, DOM APIs and the ecosystem everything else is built on.",
      bullets: ["Modern syntax and module patterns", "Async data flows and error handling", "Browser and Node runtime"],
    },
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    position: [1.4, 1.2, 0.8],
    accent: "#ffb36b",
    group: "core",
    panel: {
      eyebrow: "CORE · STYLING",
      title: "Tailwind CSS",
      body: "Utility-first styling for fast, consistent interfaces — design tokens, responsive layouts and dark/light themes without CSS sprawl.",
      bullets: [
        "Design-token driven theming",
        "Responsive, mobile-first layouts",
        "Reduced specificity conflicts",
      ],
    },
  },
  {
    id: "api",
    name: "API Development",
    position: [-3.2, 2.2, -1.5],
    accent: "#8fd8ff",
    group: "backend",
    panel: {
      eyebrow: "BACKEND · SERVICES",
      title: "API development",
      body: "REST endpoints and route handlers that applications actually run on — validated inputs, clear contracts and predictable errors.",
      bullets: [
        "RESTful route handlers in Next.js",
        "Input validation and typed responses",
        "Rate limiting and error handling",
      ],
    },
  },
  {
    id: "databases",
    name: "Databases",
    position: [3.2, 2.2, -1.5],
    accent: "#6bffd0",
    group: "backend",
    panel: {
      eyebrow: "BACKEND · DATA",
      title: "Databases",
      body: "Schema design and persistence layers — relational stores when structure matters, document stores when flexibility wins.",
      bullets: ["Schema and query design", "ORM / query-builder integration", "Caching strategies where useful"],
    },
  },
  {
    id: "auth",
    name: "Authentication",
    position: [-2.8, 1, 1.5],
    accent: "#ff8fb3",
    group: "backend",
    panel: {
      eyebrow: "BACKEND · SECURITY",
      title: "Authentication",
      body: "Session and token-based auth flows — sign-up, sign-in, protected routes and the middleware that keeps private data private.",
      bullets: [
        "Credential and OAuth flows",
        "Protected routes and middleware",
        "Session / JWT handling",
      ],
    },
  },
  {
    id: "server",
    name: "Server-side logic",
    position: [2.8, 1, 1.5],
    accent: "#b39dff",
    group: "backend",
    panel: {
      eyebrow: "BACKEND · RUNTIME",
      title: "Server-side logic",
      body: "Business logic that runs on the server — background jobs, webhooks, third-party integrations and the glue between systems.",
      bullets: [
        "Server actions and route handlers",
        "Webhook and integration endpoints",
        "Queue-style processing where needed",
      ],
    },
  },
  {
    id: "wordpress",
    name: "WordPress",
    position: [-4, 1.6, -0.8],
    accent: "#8fd8ff",
    group: "tools",
    panel: {
      eyebrow: "TOOLS · CMS",
      title: "WordPress",
      body: "100+ projects shipped — custom themes, Elementor builds, WooCommerce stores and performance work for real businesses.",
      bullets: [
        "Custom and child theme development",
        "WooCommerce storefronts",
        "Performance and Core Web Vitals tuning",
      ],
    },
  },
  {
    id: "shopify",
    name: "Shopify",
    position: [4, 1.6, -0.8],
    accent: "#6bffd0",
    group: "tools",
    panel: {
      eyebrow: "TOOLS · COMMERCE",
      title: "Shopify",
      body: "Customer-focused storefronts — theme customization, product architecture and checkout flows that reduce friction.",
      bullets: [
        "Theme setup and customization",
        "Product and collection architecture",
        "Mobile-first shopping experiences",
      ],
    },
  },
  {
    id: "tracking",
    name: "Meta Pixel & CAPI",
    position: [-1.8, 2.8, -2],
    accent: "#ffd36b",
    group: "tools",
    panel: {
      eyebrow: "TOOLS · MEASUREMENT",
      title: "Meta Pixel & Conversions API",
      body: "Browser and server-side event tracking with proper event naming, deduplication and validation — so ad platforms see accurate data.",
      bullets: [
        "Pixel + Conversions API setup",
        "Event naming and deduplication",
        "Server-side tracking pipelines",
      ],
    },
  },
  {
    id: "sst",
    name: "Server-side tracking",
    position: [1.8, 2.8, -2],
    accent: "#ffb36b",
    group: "tools",
    panel: {
      eyebrow: "TOOLS · MEASUREMENT",
      title: "Server-side tracking",
      body: "Events that survive ad-blockers and browser restrictions — fired from the server, deduplicated against the browser, and validated before reporting.",
      bullets: [
        "Server event pipelines",
        "Deduplication with browser events",
        "QA and debugging workflows",
      ],
    },
  },
];

/** A single glowing technology node with a slow pulse. */
function SkillNodeMesh({
  node,
  highlighted,
}: {
  node: SkillNode;
  highlighted: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const palette = useSceneTheme();
  const glow = palette.accent(node.accent);
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 0.8 + node.position[0]) * 0.08;
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = (highlighted ? 2.8 : 1.5 + Math.sin(t * 2 + node.position[0]) * 0.3) * palette.glow;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.4;
      shellRef.current.rotation.x += delta * 0.14;
    }
  });

  return (
    <group position={node.position}>
      {/* Solid relic core */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial
          color={palette.metal}
          emissive={glow}
          emissiveIntensity={1.5 * palette.glow}
          roughness={0.3}
          metalness={0.25}
          toneMapped={false}
        />
      </mesh>
      {/* Faceted containment shell */}
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshBasicMaterial
          color={glow}
          wireframe
          transparent
          opacity={palette.isLight ? 0.55 : 0.35}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Connection lines between related nodes. */
function ConnectionLines() {
  const palette = useSceneTheme();
  const geometry = useMemo(() => {
    const points: number[] = [];
    const core = NODES.filter((n) => n.group === "core");
    // Ring connecting core nodes
    for (let i = 0; i < core.length; i += 1) {
      const a = core[i];
      const b = core[(i + 1) % core.length];
      points.push(...a.position, ...b.position);
    }
    // Spokes from Next.js to backend
    const next = NODES.find((n) => n.id === "nextjs")!;
    for (const n of NODES.filter((entry) => entry.group === "backend")) {
      points.push(...next.position, ...n.position);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={palette.accent(ACCENT)} transparent opacity={palette.isLight ? 0.4 : 0.22} />
    </lineSegments>
  );
}
/**
 * Holographic Observatory — Skills. A constellation of technology nodes
 * floating in a dark chamber; clicking a node reveals what it is used for.
 */
export function ObservatoryScene() {
  const [pose, setPose] = useState<keyof typeof POSES>("overview");
  const [inside, setInside] = useState(false);
  const palette = useSceneTheme({ bg: "#d8dcdb", fog: "#e4e6e3" });

  return (
    <SceneScope accent={ACCENT}>
      <SceneCanvas
        cameraPosition={POSES.entrance.position}
        cameraFov={44}
        background={palette.bg}
        fog={{ color: palette.fog, density: palette.fogDensity }}
        animate
      >
        <LightRig fillColor={ACCENT} intensity={0.75} />
        <CameraDirector pose={inside ? (pose as string) : "entrance"} poses={POSES} />
        <AmbientMotes color={palette.mote} radius={7} height={5.5} count={110} size={0.16} />

        {/* The temple entrance into the observatory */}
        <TempleEntrance position={[0, 0, 11.5]} accent={ACCENT} open={inside} />

        {/* Observatory floor: disc first, inlaid ring lifted a hair to avoid z-fighting */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.5, 48]} />
          <meshStandardMaterial color={palette.floor} roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[3.5, 5.5, 48]} />
          <meshStandardMaterial color={palette.stoneDark} emissive={palette.accent(ACCENT)} emissiveIntensity={0.15} side={THREE.DoubleSide} />
        </mesh>

        {/* Slowly counter-rotating instrument rings and a central light column */}
        <OrbitRing position={[0, 0.14, 0]} radius={4.5} color={ACCENT} speed={0.16} opacity={0.32} />
        <OrbitRing position={[0, 0.2, 0]} radius={3.6} color={ACCENT} speed={-0.22} opacity={0.22} tilt={0.02} />
        <RiseBeam position={[0, 0, 0]} color={ACCENT} radius={1.4} height={6} opacity={0.05} speed={0.7} />

        <ConnectionLines />

        {NODES.map((node) => (
          <group key={node.id}>
            <SkillNodeMesh node={node} highlighted={false} />
            <Hotspot3D
              position={node.position}
              radius={0.55}
              accent={node.accent}
              object={{
                id: node.id,
                eyebrow: node.panel.eyebrow,
                title: node.panel.title,
                body: node.panel.body,
                bullets: node.panel.bullets,
                actions: [
                  { label: "Open the full skills map", onClick: () => worldActions.openCodex("skills") },
                ],
              }}
            />
          </group>
        ))}
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em] uppercase" style={{ color: "var(--loc-accent-text)" }}>
          HOLOGRAPHIC OBSERVATORY · SKILLS
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          The Capability Constellation
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Click any node to see what I build with it.
        </p>
      </div>

      <EntrancePrompt label="the Observatory" open={inside} onEnter={() => setInside(true)} />

      {inside ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap justify-center gap-2 px-4 sm:bottom-28">
          {(["overview", "core", "left", "right"] as const).map((p) => (
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
