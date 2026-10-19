"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Compass,
  MapPin,
  Package,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { artifactCatalog, RARITY, type Artifact } from "@/lib/world/artifacts";
import { useProjectsResource } from "@/lib/world/content-hooks";
import {
  achievementList,
  levelFromXp,
  levelProgress,
  progressActions,
  questViews,
  useProgress,
  XP_PER_LEVEL,
} from "@/lib/world/progress";
import { LOCATIONS } from "@/lib/world/registry";
import { isSoundEnabled, playBlip, setSoundEnabled } from "@/lib/sound";
import { worldActions } from "@/lib/world/store";

interface WorldCollectionProps {
  open: boolean;
  accent?: string;
}

function SoundToggle() {
  const [enabled, setEnabled] = useState(() => isSoundEnabled());
  const toggle = () => {
    const next = !enabled;
    setSoundEnabled(next);
    setEnabled(next);
    if (next) playBlip();
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {enabled ? "Sound on" : "Sound off"}
    </button>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const progress = useProgress();
  const discovered = progress.discoveries.includes(artifact.id);
  const collected = progress.collected.includes(artifact.id);
  const rarity = RARITY[artifact.rarity];

  const stateLabel = collected ? "Collected" : discovered ? "Discovered" : "Undiscovered";
  const stateColor = collected ? rarity.accent : discovered ? "#8fd8ff" : "#5b6b69";

  return (
    <li
      className="panel flex flex-col gap-2.5 rounded-2xl p-3.5"
      style={{ borderColor: collected ? `${rarity.accent}66` : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.55rem] tracking-[0.2em] text-faint uppercase">
          {artifact.reference}
        </span>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[0.5rem] tracking-[0.16em] uppercase"
          style={{ color: stateColor, border: `1px solid ${stateColor}55` }}
        >
          {stateLabel}
        </span>
      </div>

      <div>
        <p className="font-display text-sm leading-snug text-ink">
          {discovered || collected ? artifact.title : "Unidentified signal"}
        </p>
        <p className="mt-0.5 text-[0.7rem] text-dim">
          {discovered || collected ? artifact.classLabel : "Inspect to reveal"}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span
          className="font-mono text-[0.5rem] tracking-[0.16em] uppercase"
          style={{ color: rarity.accent }}
        >
          {rarity.label} · {rarity.xp} xp
        </span>
        {discovered && !collected ? (
          <button
            type="button"
            onClick={() => progressActions.collect(artifact.id, artifact.rarity)}
            className="flex min-h-9 items-center gap-1.5 rounded-full border border-linestrong px-3 py-1 font-mono text-[0.55rem] tracking-[0.16em] text-accent uppercase transition hover:bg-accentsoft"
          >
            <Package className="h-3 w-3" aria-hidden="true" />
            Collect
          </button>
        ) : collected ? (
          <span className="flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.16em] uppercase" style={{ color: rarity.accent }}>
            <Check className="h-3 w-3" aria-hidden="true" /> Owned
          </span>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Explorer log: level + XP, quest progress, the artifact collection
 * (undiscovered / discovered / collected), unlocked achievements, and reward
 * settings. Reads the live progression store; the same overlay is reachable
 * from every location.
 */
export function WorldCollection({ open, accent = "#63f5e7" }: WorldCollectionProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const progress = useProgress();
  const { data: projects, status } = useProjectsResource();

  const catalog = useMemo(() => artifactCatalog(projects, 6), [projects]);

  useEffect(() => {
    if (status !== "ready" || catalog.length === 0) return;
    progressActions.reportCatalog({
      total: catalog.length,
      relicIds: catalog.filter((a) => a.rarity === "relic").map((a) => a.id),
    });
  }, [catalog, status]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        worldActions.toggleCollection(false);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const level = levelFromXp(progress.xp);
  const intoLevel = progress.xp % XP_PER_LEVEL;
  const pct = Math.round(levelProgress(progress.xp) * 100);
  const quests = questViews(progress);
  const achievements = achievementList();
  const collectedCount = progress.collected.length;
  const total = catalog.length;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="world-collection"
          role="dialog"
          aria-modal="true"
          aria-label="Explorer collection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[84] flex items-start justify-center overflow-y-auto bg-black/65 p-4 pt-[5.5rem] backdrop-blur-sm sm:pt-24"
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="panel relative w-full max-w-3xl rounded-3xl p-5 sm:p-7"
            style={{ borderColor: `${accent}44` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="font-mono text-[0.6rem] tracking-[0.26em] uppercase"
                  style={{ color: accent }}
                >
                  EXPLORER LOG · COLLECTION
                </p>
                <h2 className="mt-1 font-display text-xl text-ink sm:text-2xl">
                  Level {level} Explorer
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => worldActions.toggleCollection(false)}
                aria-label="Close collection"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* XP bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-[0.55rem] tracking-[0.16em] text-faint uppercase">
                <span>{progress.xp} XP total</span>
                <span>
                  {intoLevel}/{XP_PER_LEVEL} to level {level + 1}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Level ${level} progress`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bgdeep"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: accent }}
                />
              </div>
            </div>

            {/* Stats */}
            <ul className="mt-4 grid grid-cols-3 gap-2.5">
              <li className="panel flex flex-col gap-1 rounded-2xl p-3">
                <Sparkles className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
                <span className="font-display text-lg text-ink">{progress.discoveries.length}</span>
                <span className="font-mono text-[0.5rem] tracking-[0.16em] text-faint uppercase">
                  Discovered
                </span>
              </li>
              <li className="panel flex flex-col gap-1 rounded-2xl p-3">
                <Package className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
                <span className="font-display text-lg text-ink">
                  {collectedCount}
                  {total ? `/${total}` : ""}
                </span>
                <span className="font-mono text-[0.5rem] tracking-[0.16em] text-faint uppercase">
                  Collected
                </span>
              </li>
              <li className="panel flex flex-col gap-1 rounded-2xl p-3">
                <MapPin className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
                <span className="font-display text-lg text-ink">
                  {progress.visited.length}/{LOCATIONS.length}
                </span>
                <span className="font-mono text-[0.5rem] tracking-[0.16em] text-faint uppercase">
                  Locations
                </span>
              </li>
            </ul>

            {/* Quests */}
            <section className="mt-6">
              <h3 className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" /> Quests
              </h3>
              <ul className="mt-2.5 flex flex-col gap-2">
                {quests.map((quest) => (
                  <li key={quest.id} className="panel rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm text-ink">{quest.title}</p>
                        <p className="text-[0.7rem] text-dim">{quest.detail}</p>
                      </div>
                      <span
                        className="shrink-0 font-mono text-[0.55rem] tracking-[0.14em] uppercase"
                        style={{ color: quest.done ? accent : "#5b6b69" }}
                      >
                        {quest.done ? "Complete" : `${quest.value}/${quest.target}`}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bgdeep">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.round((quest.value / quest.target) * 100)}%`,
                          backgroundColor: quest.done ? accent : "#3a4a48",
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Collection */}
            <section className="mt-6">
              <h3 className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase">
                <Package className="h-3.5 w-3.5" aria-hidden="true" /> Artifacts
              </h3>
              {status === "loading" ? (
                <p className="mt-2.5 text-sm text-dim" role="status">
                  Reading the archive…
                </p>
              ) : catalog.length === 0 ? (
                <p className="mt-2.5 text-sm text-dim">No artifacts catalogued yet.</p>
              ) : (
                <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {catalog.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </ul>
              )}
            </section>

            {/* Achievements */}
            <section className="mt-6">
              <h3 className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Achievements
              </h3>
              <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {achievements.map((achievement) => {
                  const earned = progress.achievements.includes(achievement.id);
                  return (
                    <li
                      key={achievement.id}
                      className="flex items-start gap-2.5 rounded-2xl border border-line p-3"
                      style={{ opacity: earned ? 1 : 0.5 }}
                    >
                      <Trophy
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: earned ? "#ffd36b" : "#5b6b69" }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-display text-sm text-ink">{achievement.title}</p>
                        <p className="text-[0.7rem] text-dim">{achievement.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5">
              <SoundToggle />
              <button
                type="button"
                onClick={() => progressActions.reset()}
                className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.18em] text-dim uppercase transition hover:border-linestrong hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset progress
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
