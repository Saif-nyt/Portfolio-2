"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { enterWorld } from "@/lib/game";

/**
 * Shown when WebGL is unavailable or the 3D scene fails to boot. Keeps the
 * visitor in the conventional portfolio instead of a black canvas.
 */
export function WorldFallback({ reason }: { reason: "webgl" | "error" }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[var(--bg)] px-6">
      <div className="panel flex max-w-md flex-col items-start gap-5 rounded-3xl p-7">
        <p className="eyebrow !mb-0">Signal limited</p>
        <h2 className="text-2xl leading-[1.15]">
          {reason === "webgl"
            ? "This device can't render the 3D frontier."
            : "The frontier failed to materialise."}
        </h2>
        <p className="text-sm leading-relaxed text-dim">
          The full portfolio is still here — every project, service and article is one click
          away. You can also retry the world if the problem was temporary.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/work" className="btn-primary">
            Browse the work
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact
          </Link>
          {reason === "error" ? (
            <button type="button" className="btn-ghost" onClick={() => enterWorld()}>
              <Compass className="h-4 w-4" aria-hidden="true" />
              Retry world
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
