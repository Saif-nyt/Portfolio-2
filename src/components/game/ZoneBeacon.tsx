import { Atom, BookOpen, Boxes, Check, Home, Library, Radio, Terminal } from "lucide-react";
import type { Zone, ZoneIcon } from "@/data/zones";
import { withVars } from "@/lib/styles";

const ICONS: Record<ZoneIcon, typeof Home> = {
  home: Home,
  archive: Library,
  skills: Atom,
  outpost: Terminal,
  vault: Boxes,
  nexus: Radio,
  library: BookOpen,
};

interface ZoneBeaconProps {
  zone: Zone;
  active: boolean;
  completed: boolean;
  onActivate: () => void;
}

/** A glowing wayfinding beacon marking an interactable zone. */
export function ZoneBeacon({ zone, active, completed, onActivate }: ZoneBeaconProps) {
  const Icon = ICONS[zone.icon];

  return (
    <div
      className="absolute bottom-[13%] flex w-44 -translate-x-1/2 flex-col items-center"
      style={{ left: zone.x }}
    >
      <div
        className={`pointer-events-none absolute bottom-0 h-40 w-[3px] rounded-full transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-55"
        }`}
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent) 65%, transparent))",
        }}
        aria-hidden="true"
      />

      <div
        className={`mb-3 flex flex-col items-center gap-2 transition-transform duration-300 ${
          active ? "-translate-y-1" : ""
        }`}
        style={withVars({}, { "--pulse-dur": "3.4s" })}
      >
        <button
          type="button"
          onClick={onActivate}
          aria-label={`Enter ${zone.title} — ${zone.subtitle}`}
          className={`anim-pulse relative grid h-14 w-14 place-items-center rounded-full border transition-colors duration-300 focus-visible:outline-2 ${
            active
              ? "border-accent bg-accentsoft text-accent shadow-[0_0_36px_-6px_rgba(99,245,231,0.75)]"
              : "border-line bg-[var(--veil)] text-dim backdrop-blur-md hover:border-linestrong hover:text-accent"
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
          {completed ? (
            <span
              className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-accentink"
              aria-hidden="true"
            >
              <Check className="h-3 w-3" />
            </span>
          ) : null}
        </button>
        <span className="font-mono text-[0.62rem] tracking-[0.3em] text-faint uppercase">
          {zone.number ?? "LIB"}
        </span>
      </div>

      <div
        className={`pointer-events-none absolute -top-2 w-max rounded-full border px-3 py-1 font-mono text-[0.62rem] tracking-[0.22em] uppercase transition-all duration-300 ${
          active
            ? "translate-y-0 border-accent/50 bg-[var(--veil)] text-accent opacity-100 backdrop-blur-md"
            : "translate-y-1 opacity-0"
        }`}
      >
        {zone.title}
      </div>
    </div>
  );
}
