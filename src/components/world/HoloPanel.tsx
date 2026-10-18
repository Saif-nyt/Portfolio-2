"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { ActiveObject } from "@/lib/world/store";
import { worldActions } from "@/lib/world/store";

interface HoloPanelProps {
  object: ActiveObject | null;
  accent?: string;
}

/**
 * The reusable holographic information panel. Sits above the 3D canvas,
 * traps focus while open, closes on Escape / backdrop click / close button.
 * Content stays short by design: heading, paragraph, optional bullets, actions.
 */
export function HoloPanel({ object, accent = "#63f5e7" }: HoloPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!object) return;
    // Move focus into the panel for keyboard users.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        worldActions.closePanel();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      // Minimal focus trap.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [object]);

  return (
    <AnimatePresence>
      {object ? (
        <motion.div
          key="holo-veil"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center sm:p-6"
        >
          {/* Backdrop — click to dismiss, never traps keyboard users. */}
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => worldActions.closePanel()}
            className="pointer-events-auto absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="holo-panel-title"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="panel pointer-events-auto relative z-10 flex max-h-[78dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-3xl p-6 sm:p-7"
            style={{ borderColor: `${accent}55`, boxShadow: `0 0 60px -18px ${accent}66` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                {object.eyebrow ? (
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.26em] uppercase"
                    style={{ color: accent }}
                  >
                    {object.eyebrow}
                  </p>
                ) : null}
                <h2
                  id="holo-panel-title"
                  className="font-display text-xl leading-tight text-ink sm:text-2xl"
                >
                  {object.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => worldActions.closePanel()}
                aria-label="Close"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-[0.95rem] leading-relaxed text-dim">{object.body}</p>

            {object.bullets && object.bullets.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {object.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/90">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            {object.actions && object.actions.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2.5">
                {object.actions.map((action) => {
                  // Hide malformed actions instead of rendering dead controls.
                  if (!action.href && !action.onClick) return null;

                  const className = action.href && !action.onClick ? "btn-primary" : "btn-ghost";
                  const content = action.label;
                  const isInternal = Boolean(action.href && !action.external && action.href.startsWith("/"));

                  // Callback actions close the panel first so the visitor is
                  // never left staring at a stale dialog over the result
                  // (map opened, route changed, quick-mode reveal, …).
                  if (action.onClick && !action.href) {
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          worldActions.closePanel();
                          action.onClick?.();
                        }}
                        className={className}
                      >
                        {content}
                      </button>
                    );
                  }
                  if (isInternal) {
                    return (
                      <Link
                        key={action.label}
                        href={action.href!}
                        className={className}
                        onClick={() => {
                          worldActions.closePanel();
                          action.onClick?.();
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                      className={className}
                      onClick={() => {
                        if (!action.external) worldActions.closePanel();
                        action.onClick?.();
                      }}
                    >
                      {content}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
