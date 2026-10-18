"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { worldActions, type CodexSection } from "@/lib/world/store";

const CODEX_META: Record<CodexSection, { eyebrow: string; title: string }> = {
  about: { eyebrow: "ARCHIVE RECORD · ABOUT", title: "The Full Story" },
  skills: { eyebrow: "CAPABILITY MAP · SKILLS", title: "The Ecosystem" },
  services: { eyebrow: "SERVICE REGISTRY · SERVICES", title: "What I Build" },
  work: { eyebrow: "ARTIFACT INDEX · WORK", title: "All Projects" },
  insights: { eyebrow: "FIELD NOTES · INSIGHTS", title: "The Archive" },
  contact: { eyebrow: "NEXUS UPLINK · CONTACT", title: "Start a Project" },
};

interface WorldCodexProps {
  section: CodexSection | null;
  accent?: string;
  /** Server-rendered deep content for the open section (falls through from the page). */
  children?: ReactNode;
}

/**
 * In-world codex: a scrollable full-content overlay that keeps the 3D world
 * mounted behind it. Replaces the old "revealAnchor" behaviour that ejected
 * visitors into quick mode whenever they wanted to read a story, browse
 * projects, or open the contact form.
 */
export function WorldCodex({ section, accent = "#63f5e7", children }: WorldCodexProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = section !== null;
  const meta = section ? CODEX_META[section] : null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        worldActions.closeCodex();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <AnimatePresence>
      {open && meta ? (
        <motion.div
          key="world-codex"
          role="dialog"
          aria-modal="true"
          aria-label={meta.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[82] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) worldActions.closeCodex();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="panel flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:max-h-[82dvh] sm:rounded-3xl"
            style={{ borderColor: `${accent}44` }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0">
                <p
                  className="font-mono text-[0.6rem] tracking-[0.26em] uppercase"
                  style={{ color: accent }}
                >
                  {meta.eyebrow}
                </p>
                <h2 className="mt-1 font-display text-xl text-ink sm:text-2xl">{meta.title}</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => worldActions.closeCodex()}
                aria-label="Close and return to the world"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="codex-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
