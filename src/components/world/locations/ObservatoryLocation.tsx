"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const ObservatoryScene = dynamic(
  () =>
    import("@/components/world/observatory/ObservatoryScene").then((mod) => mod.ObservatoryScene),
  { ssr: false, loading: () => null },
);

export function ObservatoryLocation({
  fallback,
  codex,
}: {
  fallback: ReactNode;
  codex?: ReactNode;
}) {
  return (
    <WorldShell
      locationId="observatory"
      accent="#b39dff"
      fallbackContent={fallback}
      codexContent={codex}
    >
      <ObservatoryScene />
    </WorldShell>
  );
}
