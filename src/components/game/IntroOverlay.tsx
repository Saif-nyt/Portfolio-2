"use client";

import { useEffect, useRef, useState } from "react";
import { Scene } from "@/components/environment/Scene";

interface IntroOverlayProps {
  onStart: () => void;
  onQuickPortfolio: () => void;
  onDismiss: () => void;
}

const ARRIVAL_LINES = ["An unknown world.", "A dormant network.", "A new explorer."];
const ARRIVAL_MS = 2600;

/** NEBULA arrival sequence: short, skippable, always offers the escape routes. */
export function IntroOverlay({ onStart, onQuickPortfolio, onDismiss }: IntroOverlayProps) {
  // Client-only component (ssr: false) — safe to read media state at init.
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setReady(true), ARRIVAL_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (ready) startRef.current?.focus();
  }, [ready]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nebula-intro-title"
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-bg"
    >
      <Scene variant="arrival" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 65% at 50% 48%, color-mix(in srgb, var(--bg) 78%, transparent), transparent 80%)",
        }}
      />

      <div className="shell relative z-10 flex flex-1 flex-col items-center justify-center gap-9 py-24 text-center">
        <p className="eyebrow">NEBULA // THE DIGITAL FRONTIER</p>

        <h1
          id="nebula-intro-title"
          className="text-gradient font-display text-[3.4rem] leading-none tracking-tight sm:text-7xl md:text-8xl"
        >
          NEBULA
        </h1>

        <div className="flex flex-col gap-2" aria-live="polite">
          {ARRIVAL_LINES.map((line, index) => (
            <p
              key={line}
              className="game-intro-line font-display text-lg text-dim sm:text-xl"
              style={{ animationDelay: `${0.35 + index * 0.6}s` }}
            >
              {line}
            </p>
          ))}
        </div>

        {ready ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button ref={startRef} type="button" className="btn-primary" onClick={onStart}>
                Start Exploration
              </button>
              <button type="button" className="btn-ghost" onClick={onQuickPortfolio}>
                Quick Portfolio
              </button>
            </div>
            <p className="font-mono text-[0.68rem] tracking-[0.22em] text-faint uppercase">
              WASD / arrows to move · Esc to exit
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="rounded-full border border-line px-5 py-2 font-mono text-[0.68rem] tracking-[0.22em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            onClick={() => setReady(true)}
          >
            Skip intro
          </button>
        )}
      </div>

      <p className="relative z-10 pb-6 text-center font-mono text-[0.62rem] tracking-[0.28em] text-faint uppercase">
        Touchdown sequence ready
      </p>
    </div>
  );
}
