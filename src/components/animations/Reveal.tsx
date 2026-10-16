"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

/**
 * Scroll-triggered entrance with a springy, game-menu pop. Content is always
 * in the DOM — motion only adjusts opacity/transform, and is skipped entirely
 * under reduced motion.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 26,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-72px" }}
      transition={{ type: "spring", stiffness: 250, damping: 23, mass: 0.75, delay }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  startDelay?: number;
}

export function Stagger({ children, className = "", stagger = 0.09, startDelay = 0 }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-72px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: startDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 320, damping: 22, mass: 0.7 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
