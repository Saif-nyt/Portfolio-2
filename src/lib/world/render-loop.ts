"use client";

/**
 * Bridge between DOM-driven camera input and the R3F demand loop.
 *
 * Scenes render on demand once motion settles, so an input event that does not
 * also change React state would otherwise be drawn only on the next unrelated
 * render. Each Canvas registers its invalidator here; input surfaces and the
 * camera director request frames while a gesture or camera ease is in flight.
 */
type FrameInvalidator = () => void;

const invalidators = new Set<FrameInvalidator>();

export function registerWorldInvalidator(invalidate: FrameInvalidator): () => void {
  invalidators.add(invalidate);
  return () => {
    invalidators.delete(invalidate);
  };
}

/** Ask every mounted world canvas for one frame (a no-op while looping). */
export function requestWorldFrame(): void {
  for (const invalidate of invalidators) invalidate();
}
