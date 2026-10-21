"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DoorwayPhase = "outside" | "opening" | "inside";

export interface DoorwayEntry {
  phase: DoorwayPhase;
  /** True while the leaves are open or opening — drives the door mesh. */
  open: boolean;
  /** True only once the doorway has actually cleared. */
  opening: boolean;
  /** Camera may cross the threshold and destination controls come back. */
  entered: boolean;
  begin: () => void;
  /** Clearance event fired by the door mesh itself. */
  opened: () => void;
  /** Visitor asked to stop waiting at the threshold. */
  skip: () => void;
  exit: () => void;
}

/**
 * The doorway transition state machine shared by every destination:
 *
 *   outside ──begin──▶ opening ──cleared | skip | watchdog──▶ inside ──exit──▶ outside
 *
 * The camera holds the exterior shot until the door reports real clearance
 * (both leaves past ~86% of their swing), so it can no longer fly through a
 * half-open leaf and strand the visitor inside the doorway. The watchdog is a
 * recovery path only — if the clearance event never arrives (a slept render
 * loop, a lost ref), the transition still completes instead of locking the
 * scene. Repeated taps are ignored: `begin` is a no-op unless the visitor is
 * outside, and `opened`/`skip` only count while opening.
 */
export function useDoorwayEntry(watchdogMs = 4000): DoorwayEntry {
  const [phase, setPhase] = useState<DoorwayPhase>("outside");
  const phaseRef = useRef<DoorwayPhase>("outside");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transition = useCallback((next: DoorwayPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearWatchdog = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearWatchdog, [clearWatchdog]);

  const begin = useCallback(() => {
    if (phaseRef.current !== "outside") return;
    transition("opening");
    timer.current = setTimeout(() => {
      timer.current = null;
      if (phaseRef.current === "opening") transition("inside");
    }, watchdogMs);
  }, [transition, watchdogMs]);

  const opened = useCallback(() => {
    if (phaseRef.current !== "opening") return;
    clearWatchdog();
    transition("inside");
  }, [clearWatchdog, transition]);

  const exit = useCallback(() => {
    clearWatchdog();
    transition("outside");
  }, [clearWatchdog, transition]);

  return {
    phase,
    open: phase !== "outside",
    opening: phase === "opening",
    entered: phase === "inside",
    begin,
    opened,
    skip: opened,
    exit,
  };
}
