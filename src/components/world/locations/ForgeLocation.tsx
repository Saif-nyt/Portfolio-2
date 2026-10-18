"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const ForgeScene = dynamic(
  () => import("@/components/world/forge/ForgeScene").then((mod) => mod.ForgeScene),
  { ssr: false, loading: () => null },
);

export function ForgeLocation({ fallback }: { fallback: ReactNode }) {
  return (
    <WorldShell locationId="forge" accent="#ffb36b" fallbackContent={fallback}>
      <ForgeScene />
    </WorldShell>
  );
}
