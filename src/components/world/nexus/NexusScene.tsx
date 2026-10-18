"use client";

import { useState } from "react";
import { SceneCanvas } from "@/components/world/SceneCanvas";
import { CameraDirector, Hotspot3D, LightRig, type CameraPose } from "@/components/world/Interactive";
import { worldActions } from "@/lib/world/store";
import { SITE } from "@/lib/site";

const ACCENT = "#ff8fb3";

const POSES: Record<string, CameraPose> = {
  overview: { position: [0, 2.6, 9], lookAt: [0, 1.4, 0] },
  terminal: { position: [-2, 2, 5.5], lookAt: [-3, 1.2, -1] },
  beacon: { position: [0, 2, 5], lookAt: [0, 1.4, -1] },
  email: { position: [2, 2, 5.5], lookAt: [3, 1.2, -1] },
};

/** Communication terminal pillar. */
function CommPillar({
  position,
  accent,
}: {
  position: [number, number, number];
  accent: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 1.8, 8]} />
        <meshStandardMaterial color="#14101a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color="#1a1220"
          emissive={accent}
          emissiveIntensity={1.8}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 2.2, 0]} color={accent} intensity={4} distance={5} decay={2} />
      {/* Base ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.75, 24]} />
        <meshStandardMaterial color="#1a1220" emissive={accent} emissiveIntensity={0.6} side={2} />
      </mesh>
      {/* Decorative label bar */}
      <mesh position={[0, 1.45, 0.36]}>
        <planeGeometry args={[0.5, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Communication Nexus — Contact. Three communication objects overlooking
 * the planet: Project Terminal (contact form), Direct Beacon (WhatsApp),
 * and Email Terminal. Contact is always reachable without completing
 * anything else.
 */
export function NexusScene() {
  const [pose, setPose] = useState<keyof typeof POSES>("overview");

  return (
    <>
      <SceneCanvas
        cameraPosition={POSES.overview.position}
        cameraFov={44}
        background="#0a0610"
        fog={{ color: "#0d0814", density: 0.045 }}
        animate
      >
        <LightRig keyColor="#e8d0f0" fillColor={ACCENT} intensity={0.78} />
        <CameraDirector pose={pose as string} poses={POSES} />

        {/* Platform */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7, 48]} />
          <meshStandardMaterial color="#100c14" roughness={0.95} />
        </mesh>
        {/* Edge glow ring — overlooks the planet */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[5.5, 6.5, 48]} />
          <meshStandardMaterial color="#160e1c" emissive={ACCENT} emissiveIntensity={0.3} side={2} />
        </mesh>

        {/* Project Terminal */}
        <CommPillar position={[-3, 0, -1]} accent="#8fd8ff" />
        <Hotspot3D
          position={[-3, 2.4, -1]}
          radius={0.85}
          accent="#8fd8ff"
          object={{
            id: "project-terminal",
            eyebrow: "PROJECT TERMINAL",
            title: "Start a project",
            body: "Tell me what you're building, what you want to improve, or where you're looking to grow. I'll reply with an honest read on scope and the smartest place to start.",
            actions: [
              { label: "Open contact form", onClick: () => worldActions.openCodex("contact") },
              { label: "See direct channels", onClick: () => worldActions.openCodex("contact") },
            ],
          }}
        />

        {/* Direct Communication Beacon — WhatsApp */}
        <CommPillar position={[0, 0, -1.5]} accent="#6bffd0" />
        <Hotspot3D
          position={[0, 2.4, -1.5]}
          radius={0.85}
          accent="#6bffd0"
          object={{
            id: "whatsapp-beacon",
            eyebrow: "DIRECT BEACON",
            title: "Chat on WhatsApp",
            body: "Opens WhatsApp directly with a message ready to send. The fastest way to reach me for a quick question or to start a conversation.",
            actions: [
              {
                label: "Open WhatsApp",
                href: SITE.whatsappUrl,
                external: true,
              },
            ],
          }}
        />

        {/* Email Terminal */}
        <CommPillar position={[3, 0, -1]} accent="#ffd36b" />
        <Hotspot3D
          position={[3, 2.4, -1]}
          radius={0.85}
          accent="#ffd36b"
          object={{
            id: "email-terminal",
            eyebrow: "EMAIL TERMINAL",
            title: "Send an email",
            body: `Best for briefs, links and anything worth a considered reply. I usually respond within one business day.`,
            actions: [
              {
                label: `Email ${SITE.email}`,
                href: `mailto:${SITE.email}`,
              },
            ],
          }}
        />
      </SceneCanvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex flex-col items-center px-6 text-center sm:top-32">
        <p className="font-mono text-[0.6rem] tracking-[0.28em]" style={{ color: ACCENT }}>
          COMMUNICATION NEXUS · CONTACT
        </p>
        <h1 className="mt-2 max-w-xl font-display text-2xl leading-tight text-ink sm:text-3xl">
          Have a project in mind?
        </h1>
        <p className="mt-2 max-w-md text-sm text-dim">
          Let&apos;s build something useful. Three channels — all reach me directly.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-wrap justify-center gap-2 px-4 sm:bottom-28">
        {(["overview", "terminal", "beacon", "email"] as const).map((p) => (
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
