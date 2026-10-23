"use client";

/**
 * The DOM half of a temple entrance: a single, obvious call to action that
 * opens the gateway, plus the waiting state shown while the leaves swing
 * clear. Kept in the HUD layer (not the 3D scene) so the scene stays
 * asset-light and the prompt is always crisp and accessible.
 */
export function EntrancePrompt({
  label,
  open,
  opening = false,
  onEnter,
  onSkip,
}: {
  label: string;
  /** True once the visitor is inside — the prompt hides. */
  open: boolean;
  /** True while the doorway is clearing — swap the CTA for a wait state. */
  opening?: boolean;
  onEnter: () => void;
  /** Optional escape hatch: don't make anyone watch the full swing. */
  onSkip?: () => void;
}) {
  // Note: `opening` implies `open` (phase !== "outside"), so the wait state
  // must be checked first — otherwise it would be unreachable dead code.
  if (opening) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-2 px-6 text-center sm:bottom-28">
        <p
          role="status"
          className="font-mono text-[0.6rem] tracking-[0.24em] uppercase"
          style={{ color: "var(--loc-accent-text)" }}
        >
          The {label.replace(/^the /, "")} gate is opening…
        </p>
        {onSkip ? (
          <button type="button" onClick={onSkip} className="panel pointer-events-auto min-h-11 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent">
            Skip wait
          </button>
        ) : null}
      </div>
    );
  }
  if (open) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-28 sm:pb-24">
      <button type="button" onClick={onEnter} className="btn-primary pointer-events-auto">
        Enter {label}
      </button>
    </div>
  );
}
