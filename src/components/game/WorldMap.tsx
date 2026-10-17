"use client";

import type { MouseEvent } from "react";
import { X } from "lucide-react";
import { WORLD_WIDTH, type Zone } from "@/data/zones";

interface WorldMapProps {
  zones: Zone[];
  playerX: number;
  completedIds: string[];
  onTravel: (zone: Zone) => void;
  onTravelTo: (x: number) => void;
  onClose: () => void;
}

/** Schematic strip map of the frontier with quick travel. */
export function WorldMap({
  zones,
  playerX,
  completedIds,
  onTravel,
  onTravelTo,
  onClose,
}: WorldMapProps) {
  const handleStripClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onTravelTo(Math.round(ratio * WORLD_WIDTH));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="World map"
      className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-sm"
    >
      <div className="panel w-[min(56rem,calc(100vw-2rem))] rounded-3xl p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Navigational chart</p>
            <h2 className="font-display text-xl sm:text-2xl">The Digital Frontier</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close world map"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative h-28 cursor-crosshair overflow-hidden rounded-2xl border border-line bg-bgdeep"
          onClick={handleStripClick}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 45%, transparent), transparent)",
            }}
          />
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTravel(zone);
              }}
              className="group absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${(zone.x / WORLD_WIDTH) * 100}%` }}
              aria-label={`Travel near ${zone.title}`}
            >
              <span
                className={`h-3 w-3 rounded-full border border-accent transition group-hover:bg-accent ${
                  completedIds.includes(zone.id) ? "bg-accent" : "bg-accentsoft"
                }`}
              />
              <span className="font-mono text-[0.58rem] tracking-[0.18em] text-faint uppercase transition group-hover:text-accent">
                {zone.number ?? "LIB"}
              </span>
            </button>
          ))}
          <div
            aria-hidden="true"
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-chalk bg-accent"
            style={{ left: `${(playerX / WORLD_WIDTH) * 100}%` }}
          />
        </div>

        <p className="mt-4 font-mono text-[0.65rem] tracking-[0.2em] text-faint uppercase">
          Click a marker to travel · click the chart to walk there
        </p>
      </div>
    </div>
  );
}
