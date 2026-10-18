"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const VaultScene = dynamic(
  () => import("@/components/world/vault/VaultScene").then((mod) => mod.VaultScene),
  { ssr: false, loading: () => null },
);

export function VaultLocation({
  fallback,
  codex,
}: {
  fallback: ReactNode;
  codex?: ReactNode;
}) {
  return (
    <WorldShell locationId="vault" accent="#6bffd0" fallbackContent={fallback} codexContent={codex}>
      <VaultScene />
    </WorldShell>
  );
}
