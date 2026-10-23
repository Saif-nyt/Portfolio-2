"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { LOCATIONS, type LocationId } from "@/lib/world/registry";
import { worldActions } from "@/lib/world/store";

interface WorldMapOverlayProps {
  open: boolean;
  currentId: LocationId;
  onNavigate: (id: LocationId) => void;
  accent?: string;
}

/**
 * Central navigation: a stylized 2D star-chart of all seven locations.
 * Fully keyboard accessible; Escape closes; each node is a real link so
 * browser history and deep links keep working.
 */
export function WorldMapOverlay({
  open,
  currentId,
  onNavigate,
  accent = "#63f5e7",
}: WorldMapOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        worldActions.toggleMap(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreRef.current?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="world-map"
          role="dialog"
          aria-modal="true"
          aria-label="World map"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-[var(--veil)] p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) worldActions.toggleMap(false);
          }}
        >
          <motion.div
            ref={panelRef}
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="panel relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 sm:p-7"
            style={{ borderColor: `${accent}44` }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.6rem] tracking-[0.26em] uppercase" style={{ color: accent }}>
                  NEBULA · STAR CHART
                </p>
                <h2 className="mt-1 font-display text-xl text-ink sm:text-2xl">Choose a location</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => worldActions.toggleMap(false)}
                aria-label="Close map"
                className="grid h-11 w-11 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Star-chart canvas */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-bgdeep">
              {/* faint grid */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(163,217,214,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(163,217,214,0.08) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              {/* path line connecting nodes */}
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={LOCATIONS.map((l) => `${l.mapX * 100},${l.mapY * 100}`).join(" ")}
                  fill="none"
                  stroke={accent}
                  strokeOpacity="0.28"
                  strokeWidth="0.4"
                  strokeDasharray="1.4 1.4"
                />
              </svg>

              {LOCATIONS.map((location) => {
                const isCurrent = location.id === currentId;
                // Clamp edge labels so nodes near the chart border (Nexus at
                // 0.94, Arrival at 0.10) don't get clipped by overflow-hidden.
                const labelPosition =
                  location.mapX > 0.8
                    ? "right-0 translate-x-0"
                    : location.mapX < 0.15
                      ? "left-0 translate-x-0"
                      : "left-1/2 -translate-x-1/2";
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => onNavigate(location.id)}
                    aria-current={isCurrent ? "page" : undefined}
                    aria-label={`${location.title} — ${location.subtitle}`}
                    className="group absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                    style={{ left: `${location.mapX * 100}%`, top: `${location.mapY * 100}%` }}
                  >
                    <span
                      aria-hidden="true"
                      className="block h-3.5 w-3.5 rounded-full border-2 transition group-hover:scale-125 group-focus-visible:scale-125"
                      style={{
                        borderColor: location.accent,
                        backgroundColor: isCurrent ? location.accent : "transparent",
                        boxShadow: isCurrent ? `0 0 14px ${location.accent}` : `0 0 8px ${location.accent}55`,
                      }}
                    />
                    <span
                      className={`pointer-events-none absolute top-full hidden w-max rounded-md bg-bgdeep/90 px-2 py-1 font-mono text-[0.55rem] tracking-[0.14em] text-ink uppercase transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block sm:opacity-0 ${labelPosition}`}
                    >
                      {location.number} · {location.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {LOCATIONS.map((location) => (
                <li key={location.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(location.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-accentsoft"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: location.accent }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm text-ink">{location.title}</span>
                      <span className="block truncate text-[0.72rem] text-dim">{location.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
