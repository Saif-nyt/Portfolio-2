"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { ActionLink } from "@/components/ui/ActionLink";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-accent" aria-hidden="true" />
      <p className="eyebrow">Signal lost</p>
      <h1 className="max-w-xl text-3xl tracking-tight sm:text-4xl">
        Something interrupted the transmission.
      </h1>
      <p className="max-w-md text-base leading-relaxed text-dim">
        This page failed to load. You can retry the transmission, or head back to the landing
        zone.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <ActionLink href="/" variant="ghost">
          Return home
        </ActionLink>
        <ActionLink href="/contact" variant="ghost">
          Report the issue
        </ActionLink>
      </div>
    </div>
  );
}
