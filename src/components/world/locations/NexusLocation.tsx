"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const NexusScene = dynamic(
  () => import("@/components/world/nexus/NexusScene").then((mod) => mod.NexusScene),
  { ssr: false, loading: () => null },
);

export function NexusLocation({
  fallback,
  codex,
}: {
  fallback: ReactNode;
  codex?: ReactNode;
}) {
  return (
    <WorldShell locationId="nexus" accent="#ff8fb3" fallbackContent={fallback} codexContent={codex}>
      <NexusScene />
    </WorldShell>
  );
}
