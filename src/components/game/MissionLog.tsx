"use client";

import { ClipboardList, RotateCcw, Route, Check } from "lucide-react";
import { MISSIONS, MISSION_TOTAL } from "@/data/missions";
import { resetProgress, useMissionProgress } from "@/lib/missions";
import { setStoredMode } from "@/lib/mode";
import { exitWorld } from "@/lib/game";

interface MissionLogProps {
  open: boolean;
  onToggle: () => void;
}

/** Collapsible mission log with progress, reset and the portfolio escape hatch. */
export function MissionLog({ open, onToggle }: MissionLogProps) {
  const progress = useMissionProgress();
  const done = new Set(progress.completed);

  const skipToPortfolio = () => {
    setStoredMode("quick");
    exitWorld();
  };

  return (
    <div className="absolute top-16 left-4 z-30 flex flex-col items-start gap-2 sm:top-[4.6rem] sm:left-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="panel flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
      >
        <ClipboardList className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        Missions {done.size}/{MISSION_TOTAL}
        <span className="flex gap-1" aria-hidden="true">
          {MISSIONS.map((mission) => (
            <span
              key={mission.id}
              className={`h-1.5 w-1.5 rounded-full ${done.has(mission.id) ? "bg-accent" : "bg-line"}`}
            />
          ))}
        </span>
      </button>

      {open ? (
        <div className="panel w-[min(21rem,calc(100vw-2rem))] rounded-3xl p-4">
          <p className="eyebrow mb-3">Mission log</p>
          <ol className="flex max-h-64 flex-col gap-2.5 overflow-y-auto pr-1">
            {MISSIONS.map((mission) => {
              const complete = done.has(mission.id);
              return (
                <li key={mission.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border font-mono text-[0.55rem] ${
                      complete
                        ? "border-accent bg-accent text-accentink"
                        : "border-line text-faint"
                    }`}
                    aria-hidden="true"
                  >
                    {complete ? <Check className="h-3 w-3" /> : mission.number}
                  </span>
                  <div>
                    <p className={`text-sm ${complete ? "text-ink" : "text-dim"}`}>
                      {mission.title}
                    </p>
                    <p className="text-xs text-faint">{mission.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={skipToPortfolio}
              className="flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[0.62rem] tracking-[0.2em] text-dim uppercase transition hover:text-accent"
            >
              <Route className="h-3.5 w-3.5" aria-hidden="true" />
              Skip to portfolio
            </button>
            <button
              type="button"
              onClick={resetProgress}
              className="flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[0.62rem] tracking-[0.2em] text-faint uppercase transition hover:text-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset progress
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
