"use client";

/**
 * The DOM half of a temple entrance: a single, obvious call to action that
 * opens the gateway. Kept in the HUD layer (not the 3D scene) so the scene
 * stays asset-light and the prompt is always crisp and accessible.
 */
export function EntrancePrompt({
  label,
  open,
  onEnter,
}: {
  label: string;
  /** True once the visitor is inside — the prompt hides. */
  open: boolean;
  onEnter: () => void;
}) {
  if (open) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-28 sm:pb-24">
      <button type="button" onClick={onEnter} className="btn-primary pointer-events-auto">
        Enter {label}
      </button>
    </div>
  );
}
