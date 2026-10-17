"use client";

import { useEffect, useRef } from "react";

/**
 * A soft glow orb that trails the pointer with easing and swells over
 * interactive targets — game-style feedback without hiding the native
 * cursor. Fine pointers only; the element stays invisible (opacity 0)
 * otherwise and under reduced motion (CSS + effect guard).
 */
export function CursorWisp() {
  const outerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const core = coreRef.current;
    if (!outer || !core) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let targetX = -100;
    let targetY = -100;
    let x = -100;
    let y = -100;
    let scale = 1;
    let targetScale = 1;
    let started = false;
    let frame = 0;
    let running = false;
    let lastTransform = "";

    const loop = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      scale += (targetScale - scale) * 0.16;

      const transform = `translate3d(${x - 13}px, ${y - 13}px, 0) scale(${scale.toFixed(3)})`;
      if (transform !== lastTransform) {
        outer.style.transform = transform;
        lastTransform = transform;
      }

      if (
        Math.abs(targetX - x) < 0.05 &&
        Math.abs(targetY - y) < 0.05 &&
        Math.abs(targetScale - scale) < 0.01
      ) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!started) {
        started = true;
        x = targetX;
        y = targetY;
        outer.classList.add("is-on");
      }
      start();
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const interactive =
        target && typeof target.closest === "function"
          ? target.closest("a, button, [role='button']")
          : null;
      const nextScale = interactive ? 2.2 : 1;
      if (nextScale !== targetScale) {
        targetScale = nextScale;
        start();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      if (running) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, []);

  return (
    <div ref={outerRef} className="cursor-wisp" aria-hidden="true">
      <span ref={coreRef} className="cursor-wisp-core" />
    </div>
  );
}
