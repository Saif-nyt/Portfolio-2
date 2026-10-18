"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const TempleScene = dynamic(
  () => import("@/components/world/temple/TempleScene").then((mod) => mod.TempleScene),
  { ssr: false, loading: () => null },
);

/**
 * About location wrapper. The temple scene loads only on the client inside
 * the shared WorldShell; the conventional About content (passed from the
 * server page) remains the accessible / SEO / quick-mode fallback beneath it.
 */
export function AboutLocation({
  fallback,
  codex,
}: {
  fallback: ReactNode;
  codex?: ReactNode;
}) {
  return (
    <WorldShell locationId="temple" accent="#8fd8ff" fallbackContent={fallback} codexContent={codex}>
      <TempleScene />
    </WorldShell>
  );
}
