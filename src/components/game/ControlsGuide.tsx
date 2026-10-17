"use client";

import { Keyboard, MousePointerClick, Move, X } from "lucide-react";
import { writeJson } from "@/lib/storage";

interface ControlsGuideProps {
  isMobile: boolean;
  onClose: () => void;
}

/** First-visit controls briefing; dismissal is remembered. */
export function ControlsGuide({ isMobile, onClose }: ControlsGuideProps) {
  const dismiss = () => {
    writeJson("controls-seen", true);
    onClose();
  };

  const rows = isMobile
    ? [
        { icon: Move, label: "Drag the joystick to walk" },
        { icon: MousePointerClick, label: "Tap a beacon to approach & enter" },
      ]
    : [
        { icon: Move, label: "WASD or arrow keys to walk" },
        { icon: Keyboard, label: "E to enter · M for map · Esc to exit" },
      ];

  return (
    <div
      role="dialog"
      aria-label="Controls guide"
      className="panel pointer-events-auto absolute bottom-24 left-1/2 z-30 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl p-5 md:bottom-8"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Field manual</p>
          <p className="font-display text-lg">Explorer controls</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss controls guide"
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-dim transition hover:border-linestrong hover:text-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 text-sm text-dim">
            <row.icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            {row.label}
          </li>
        ))}
      </ul>
      <button type="button" className="btn-primary mt-4 w-full" onClick={dismiss}>
        Begin exploration
      </button>
    </div>
  );
}
