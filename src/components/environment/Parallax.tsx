"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useIsMobile } from "@/lib/hooks";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Positive: moves down as the section enters. Negative: rises. */
  distance?: number;
}

/**
 * Lightweight scroll parallax built on transforms only. Disabled on small
 * viewports and whenever the visitor prefers reduced motion.
 */
export function Parallax({ children, className = "", distance = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (reduceMotion || isMobile) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
