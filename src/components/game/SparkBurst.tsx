"use client";

import { useEffect } from "react";

const SPARK_COLORS = ["#63f5e7", "#37d6c5", "#e6bf6a", "#a3d9d6", "#f2f5ef"];
const MAX_SPARKS = 48;

/**
 * Arcade-style hit sparks: pointer-down on any link/button throws a small
 * burst of light shards from the touch point. Purely decorative, capped for
 * performance, and skipped entirely under reduced motion.
 */
export function SparkBurst() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = 0;

    const spawn = (x: number, y: number) => {
      const count = 7 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        if (active >= MAX_SPARKS) return;
        const spark = document.createElement("span");
        spark.className = "spark";
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.7;
        const distance = 26 + Math.random() * 44;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.setProperty("--dx", `${Math.round(Math.cos(angle) * distance)}px`);
        spark.style.setProperty("--dy", `${Math.round(Math.sin(angle) * distance)}px`);
        spark.style.setProperty("--c", SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]);
        spark.style.setProperty("--s", `${4 + Math.random() * 5}px`);
        spark.style.setProperty("--sd", `${0.45 + Math.random() * 0.35}s`);
        active += 1;
        spark.addEventListener(
          "animationend",
          () => {
            spark.remove();
            active -= 1;
          },
          { once: true },
        );
        document.body.appendChild(spark);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== "function") return;
      if (target.closest("a, button, [role='button']")) {
        spawn(event.clientX, event.clientY);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.querySelectorAll(".spark").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
