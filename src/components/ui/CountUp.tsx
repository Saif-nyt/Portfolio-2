"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface Parsed {
  target: number;
  suffix: string;
  decimals: number;
}

function parseValue(value: string): Parsed | null {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value);
  if (!match) return null;
  const digits = match[1];
  return {
    target: parseFloat(digits),
    suffix: match[2],
    decimals: digits.includes(".") ? digits.split(".")[1].length : 0,
  };
}

/**
 * XP-counter: animates a numeric stat ("100+", "1.5 years") up from zero
 * the first time it scrolls into view. Server renders the final value (no
 * hydration mismatch); reduced motion keeps it static.
 */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const parsed = parseValue(value);
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const target = parseValue(value);
    if (!target || reduceMotion) return;
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;

    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();

        const duration = 1300;
        const begin = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - begin) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = target.target * eased;
          setDisplay(t < 1 ? `${current.toFixed(target.decimals)}${target.suffix}` : value);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reduceMotion]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
