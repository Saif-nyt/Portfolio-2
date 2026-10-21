"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { addLookInput, addZoom, resetMoveInput, setMoveInput, useWorldState } from "@/lib/world/store";
import { requestWorldFrame } from "@/lib/world/render-loop";

/** Finger travel (px) before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 8;
/** Drag distance (px) that maps to full movement intensity. */
const SATURATION = 110;
/** Pinch sensitivity: how strongly the finger-distance ratio changes zoom. */
const PINCH_GAIN = 1.7;
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

function pointerDistance(pointers: Map<number, { x: number; y: number }>): number {
  let first: { x: number; y: number } | null = null;
  for (const point of pointers.values()) {
    if (!first) {
      first = point;
      continue;
    }
    return Math.hypot(first.x - point.x, first.y - point.y);
  }
  return 0;
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
 * when pointer events are sparse. A two-finger pinch (or a ctrl-scroll from a
 * trackpad) zooms the camera in and out so the whole world can be taken in.
 */
export function WorldNavSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { activeObject, mapOpen, codex, collectionOpen, walkMode } = useWorldState();
  // An open panel/map/codex/collection takes over the screen; block world movement behind it.
  const blocked = Boolean(activeObject) || mapOpen || codex !== null || collectionOpen;
  const blockedRef = useRef(blocked);
  // In walk mode a drag looks the camera; the virtual joystick owns movement.
  const walkRef = useRef(walkMode);

  useEffect(() => {
    blockedRef.current = blocked;
    if (blocked) resetMoveInput();
  }, [blocked]);

  useEffect(() => {
    walkRef.current = walkMode;
  }, [walkMode]);

  useEffect(() => {
    const surface = ref.current;
    if (!surface) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let dragId = -1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = false;
    let pinching = false;
    let pinchDist = 0;
    let suppressClickUntil = 0;

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const endDrag = () => {
      dragId = -1;
      moved = false;
      resetMoveInput();
    };

    const end = () => {
      pointers.clear();
      pinching = false;
      pinchDist = 0;
      endDrag();
      // Let the demand loop ease the camera back to rest after an interrupted
      // gesture, even when no pointerup follows (blur, hidden tab, unmount).
      requestWorldFrame();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (blockedRef.current || isInteractive(event.target)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        // In walk mode movement belongs to the joystick; ignore extra fingers.
        if (walkRef.current) return;
        // A second finger turns the gesture into a pinch; abandon any drag.
        pinching = true;
        moved = true;
        pinchDist = pointerDistance(pointers);
        if (dragId !== -1) endDrag();
        return;
      }
      dragId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      moved = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointers.has(event.pointerId)) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (pinching) {
        if (pointers.size < 2) return;
        const dist = pointerDistance(pointers);
        if (pinchDist > 0 && dist > 0) addZoom(Math.log(dist / pinchDist) * PINCH_GAIN);
        pinchDist = dist;
        requestWorldFrame();
        return;
      }
      if (dragId === -1 || event.pointerId !== dragId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true;
      if (!moved) {
        lastX = event.clientX;
        lastY = event.clientY;
        return;
      }
      if (walkRef.current) {
        addLookInput(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
        return;
      }
      // Origin is the joystick centre; displacement sets direction + intensity.
      setMoveInput(clampUnit(dx / SATURATION), clampUnit(-dy / SATURATION));
      requestWorldFrame();
    };

    const onPointerUp = (event: PointerEvent) => {
      const tracked = pointers.delete(event.pointerId);
      if (!tracked && event.pointerId !== dragId) return;
      if (pinching && pointers.size < 2) {
        pinching = false;
        pinchDist = 0;
        suppressClickUntil = performance.now() + CLICK_SUPPRESS_MS;
      }
      if (event.pointerId === dragId) {
        if (moved) suppressClickUntil = performance.now() + CLICK_SUPPRESS_MS;
        endDrag();
        requestWorldFrame();
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        end();
      } else if (event.pointerId === dragId) {
        endDrag();
      }
    };

    // Capture phase: runs before the raycast canvas sees the click, so a drag
    // never fires an artifact / button. A plain tap is left untouched.
    const onClickCapture = (event: MouseEvent) => {
      // Never swallow a real control's click, even immediately after a swipe:
      // the user lifted on a button, so that is the intent. Only trailing
      // clicks on world space are treated as accidental post-drag taps.
      if (isInteractive(event.target)) return;
      if (performance.now() > suppressClickUntil) return;
      suppressClickUntil = 0;
      event.stopPropagation();
      event.preventDefault();
    };

    // Trackpad pinch arrives as a ctrl-modified wheel; plain wheel is left to
    // the page so the world never hijacks document scrolling.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || blockedRef.current) return;
      event.preventDefault();
      addZoom(-event.deltaY * 0.002);
      requestWorldFrame();
    };

    const onInterrupt = () => end();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") end();
    };

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("lostpointercapture", onPointerCancel);
    surface.addEventListener("click", onClickCapture, true);
    surface.addEventListener("wheel", onWheel, { passive: false });
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
      surface.removeEventListener("wheel", onWheel);
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
