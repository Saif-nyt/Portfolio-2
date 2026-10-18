"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WorldShell } from "@/components/world/WorldShell";

const ArrivalScene = dynamic(
  () => import("@/components/world/arrival/ArrivalScene").then((mod) => mod.ArrivalScene),
  { ssr: false, loading: () => null },
);

export function ArrivalLocation({ fallback }: { fallback: ReactNode }) {
  return (
    <WorldShell locationId="arrival" accent="#63f5e7" fallbackContent={fallback}>
      <ArrivalScene />
    </WorldShell>
  );
}
