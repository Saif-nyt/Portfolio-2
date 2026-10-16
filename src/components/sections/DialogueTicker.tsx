"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

const LINES = [
  "> quest log updated: fresh case studies published",
  "> systems nominal — open for new commissions",
  "> conversions tracked. numbers don't lie.",
  "> bioluminescence stable. let's build something.",
];

const TYPE_MS = 42;
const HOLD_MS = 3600;

/**
 * RPG-style status dialogue that types out rotating flavour lines under the
 * hero. Decorative (aria-hidden); renders empty server-side so hydration
 * matches, then types client-side. Reduced motion shows line one, static.
 */
export function DialogueTicker() {
  const reduceMotion = usePrefersReducedMotion();
  const [line, setLine] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduceMotion) return;

    let cancelled = false;
    let char = 0;
    let timer: ReturnType<typeof setTimeout>;

    const type = () => {
      if (cancelled) return;
      char += 1;
      setText(LINES[line].slice(0, char));
      if (char < LINES[line].length) {
        timer = setTimeout(type, TYPE_MS + Math.random() * 45);
      } else {
        timer = setTimeout(() => {
          if (cancelled) return;
          setText("");
          setLine((current) => (current + 1) % LINES.length);
        }, HOLD_MS);
      }
    };

    timer = setTimeout(type, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [line, reduceMotion]);

  // Reduced motion: line one, rendered statically (derived — no effect write).
  const display = reduceMotion ? LINES[0] : text;

  return (
    <p className="dialogue-box max-w-xl" aria-hidden="true">
      <span className="text-accent">&#9656;&nbsp;</span>
      <span>{display}</span>
      <span className="dialogue-caret">&#9612;</span>
    </p>
  );
}
