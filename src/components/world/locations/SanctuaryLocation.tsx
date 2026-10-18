"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const SanctuaryScene = dynamic(
  () =>
    import("@/components/world/sanctuary/SanctuaryScene").then((mod) => mod.SanctuaryScene),
  { ssr: false, loading: () => null },
);

export function SanctuaryLocation({ fallback }: { fallback: ReactNode }) {
  return (
    <WorldShell locationId="sanctuary" accent="#ffd36b" fallbackContent={fallback}>
      <SanctuaryScene />
    </WorldShell>
  );
}
