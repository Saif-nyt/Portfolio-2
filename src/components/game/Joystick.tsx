"use client";

import { useCallback, useRef } from "react";

interface JoystickProps {
  /** Horizontal axis in [-1, 1]; 0 when released. */
  onChange: (axis: number) => void;
}

const MAX_OFFSET = 42;

/** Thumb joystick for coarse pointers — horizontal walk control. */
export function Joystick({ onChange }: JoystickProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const knob = knobRef.current;
      if (!knob) return;
      const pad = knob.parentElement;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const clamped = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx));
      knob.style.transform = `translate3d(${clamped}px, 0, 0)`;
      onChange(clamped / MAX_OFFSET);
    },
    [onChange],
  );

  const release = useCallback(() => {
    activeRef.current = null;
    const knob = knobRef.current;
    if (knob) knob.style.transform = "translate3d(0, 0, 0)";
    onChange(0);
  }, [onChange]);

  return (
    <div
      className="pointer-events-auto relative grid h-28 w-28 touch-none place-items-center rounded-full border border-line bg-[var(--veil)] backdrop-blur-md"
      role="presentation"
      onPointerDown={(event) => {
        activeRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        handleMove(event.clientX);
      }}
      onPointerMove={(event) => {
        if (activeRef.current !== event.pointerId) return;
        handleMove(event.clientX);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        ref={knobRef}
        aria-hidden="true"
        className="h-12 w-12 rounded-full border border-linestrong bg-accentsoft transition-transform duration-75"
      >
        <span className="grid h-full w-full place-items-center">
          <span className="h-2 w-2 rounded-full bg-accent" />
        </span>
      </div>
    </div>
  );
}
