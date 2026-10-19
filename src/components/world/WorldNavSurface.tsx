"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { resetMoveInput, setMoveInput, useWorldState } from "@/lib/world/store";

/** Finger travel (px) before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 8;
/** Drag distance (px) that maps to full movement intensity. */
const SATURATION = 110;
/** How long after a drag to swallow the trailing click (ms). */
const CLICK_SUPPRESS_MS = 400;

/**
 * Elements that own their own taps: links, buttons, form fields, overlays.
 * A press that starts on one of these never becomes world navigation, so the
 * control behaves exactly as it would without this layer.
 */
const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, summary, [role="button"], [role="dialog"], [contenteditable="true"], [data-world-ui]';

function clampUnit(value: number): number {
  return value < -1 ? -1 : value > 1 ? 1 : value;
}

/**
 * The invisible full-screen joystick. Wraps a world location's scene layer and
 * turns any press-and-drag on empty world space into a normalised movement
 * vector — no thumbstick, ring, or overlay is ever drawn. A press is only a
 * drag once it passes {@link DRAG_THRESHOLD}; below that it stays a tap so
 * artifacts still open on click. The click that trails a real drag is
 * swallowed so a swipe never accidentally activates whatever it ends on.
 *
 * The vector is written to the world store (not React state) and consumed by
 * {@link CameraDirector} each frame, so sustained dragging keeps moving even
 * when pointer events are sparse.
 */
export function WorldNavSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { activeObject, mapOpen, codex, collectionOpen } = useWorldState();
  // An open panel/map/codex/collection takes over the screen; block world movement behind it.
  const blocked = Boolean(activeObject) || mapOpen || codex !== null || collectionOpen;
  const blockedRef = useRef(blocked);

  useEffect(() => {
    blockedRef.current = blocked;
    if (blocked) resetMoveInput();
  }, [blocked]);

  useEffect(() => {
    const surface = ref.current;
    if (!surface) return;

    let active = false;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let suppressClickUntil = 0;

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const end = () => {
      active = false;
      pointerId = -1;
      moved = false;
      resetMoveInput();
    };

    const onPointerDown = (event: PointerEvent) => {
      // One gesture at a time; the first touch wins and extras are ignored.
      if (active || !event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (blockedRef.current || isInteractive(event.target)) return;
      active = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true;
      if (!moved) return;
      // Origin is the joystick centre; displacement sets direction + intensity.
      setMoveInput(clampUnit(dx / SATURATION), clampUnit(-dy / SATURATION));
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId) return;
      if (moved) suppressClickUntil = performance.now() + CLICK_SUPPRESS_MS;
      end();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId) return;
      end();
    };

    // Capture phase: runs before the raycast canvas sees the click, so a drag
    // never fires an artifact / button. A plain tap is left untouched.
    const onClickCapture = (event: MouseEvent) => {
      if (performance.now() > suppressClickUntil) return;
      suppressClickUntil = 0;
      event.stopPropagation();
      event.preventDefault();
    };

    const onInterrupt = () => end();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") end();
    };

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("lostpointercapture", onPointerCancel);
    surface.addEventListener("click", onClickCapture, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("blur", onInterrupt);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      end();
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("lostpointercapture", onPointerCancel);
      surface.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onInterrupt);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
