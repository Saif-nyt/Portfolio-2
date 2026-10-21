"use client";

import { useCallback, useRef, useState } from "react";
import { Compass, MousePointer2, X } from "lucide-react";
import { useIsMobile } from "@/lib/hooks";
import { resetWalkInput, setWalkInput } from "@/lib/world/store";
import { readJson, writeJson } from "@/lib/storage";

const HINT_KEY = "home-walk-hint";

function requestWorldPointerLock() {
  if (typeof document === "undefined") return;
  const canvas = Array.from(document.querySelectorAll<HTMLCanvasElement>("canvas")).find(
    (node) => node.offsetWidth > 0 && node.offsetHeight > 0,
  );
  canvas?.requestPointerLock();
}

/** Left-thumb virtual joystick. Writes straight to the mutable walk store. */
export function WalkJoystick({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();
  const pointerId = useRef<number | null>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;
    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = clientX - (rect.left + radius);
    const dy = clientY - (rect.top + radius);
    const limit = radius - 20;
    const distance = Math.hypot(dx, dy);
    const nx = distance > limit ? (dx / distance) * limit : dx;
    const ny = distance > limit ? (dy / distance) * limit : dy;
    knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    setWalkInput(nx / limit, -ny / limit);
  }, []);

  const end = useCallback(() => {
    pointerId.current = null;
    resetWalkInput();
    if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
  }, []);

  if (!visible || !isMobile) return null;

  return (
    <div
      data-world-ui
      className="pointer-events-auto absolute bottom-24 left-4 z-40 h-28 w-28 touch-none select-none"
    >
      <div
        ref={baseRef}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          pointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (pointerId.current === event.pointerId) update(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (pointerId.current === event.pointerId) end();
        }}
        onPointerCancel={end}
        onLostPointerCapture={end}
        aria-label="Walk joystick"
        role="application"
        className="relative h-full w-full rounded-full border border-line bg-[var(--veil)]/80 backdrop-blur-md"
      >
        <span className="pointer-events-none absolute inset-4 rounded-full border border-line/60" />
        <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[0.45rem] tracking-[0.18em] text-faint uppercase">
          Move
        </span>
        <div
          ref={knobRef}
          style={{ boxShadow: "0 0 22px color-mix(in srgb, var(--accent) 28%, transparent)" }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/40 bg-accent/15"
        />
      </div>
    </div>
  );
}

/** Small, dismissible control card shown when walking starts. */
export function WalkHint({
  visible,
  accent,
}: {
  visible: boolean;
  accent: string;
}) {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(() => readJson<boolean>(HINT_KEY, false));

  const dismiss = useCallback(() => {
    writeJson(HINT_KEY, true);
    setDismissed(true);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      data-world-ui
      className="pointer-events-auto absolute right-3 bottom-[13.5rem] z-40 w-[min(17rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-bgdeep/95 p-3.5 backdrop-blur-md sm:bottom-24 sm:right-4"
    >
      <div className="flex items-start gap-2.5">
        <Compass className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.56rem] tracking-[0.2em] text-ink uppercase">Walking</p>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            {isMobile
              ? "Use the joystick to move. Drag the world to look around."
              : "WASD or arrow keys to move · Shift to sprint · Drag to look."}
          </p>
          {!isMobile ? (
            <button
              type="button"
              onClick={requestWorldPointerLock}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-2.5 py-1.5 font-mono text-[0.5rem] tracking-[0.15em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            >
              <MousePointer2 className="h-3 w-3" aria-hidden="true" />
              Capture mouse · Esc releases
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss walking controls"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
