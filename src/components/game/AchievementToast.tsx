"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { ACHIEVEMENT_EVENT, type Achievement } from "@/lib/game";
import { playAchievement } from "@/lib/sound";

const SEEN_KEY = "pandora:achievements";
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const HOLD_MS = 4200;
const LEAVE_MS = 420;

function readSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...readSeen(), id]));
  } catch {
    // private mode — achievements simply replay, still deduped per session
  }
}

/**
 * Game-style achievement popups (bottom-left). Sources: custom events via
 * `unlockAchievement`, reaching the footer, and the Konami code. Each id is
 * shown once (localStorage), announced politely for screen readers.
 */
export function AchievementToast() {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = (achievement: Achievement) => {
      if (!achievement?.id) return;
      const seen = readSeen();
      if (seen.includes(achievement.id)) return;
      markSeen(achievement.id);
      playAchievement();
      setLeaving(false);
      setCurrent(achievement);
    };

    const onUnlock = (event: Event) => {
      const detail = (event as CustomEvent<Achievement>).detail;
      if (detail) show(detail);
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onUnlock);

    let observer: IntersectionObserver | null = null;
    const footer = document.querySelector("footer");
    if (footer && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            show({ id: "pathfinder", title: "Pathfinder", detail: "Reached the end of the trail" });
          }
        },
        { threshold: 0.25 },
      );
      observer.observe(footer);
    }

    let index = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === KONAMI[index]) {
        index += 1;
        if (index === KONAMI.length) {
          index = 0;
          show({ id: "konami", title: "8-Bit Legend", detail: "Cheat code accepted" });
        }
      } else {
        index = key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(ACHIEVEMENT_EVENT, onUnlock);
      window.removeEventListener("keydown", onKeyDown);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    let leave: ReturnType<typeof setTimeout> | undefined;
    const hold = setTimeout(() => {
      setLeaving(true);
      leave = setTimeout(() => {
        setCurrent(null);
        setLeaving(false);
      }, LEAVE_MS);
    }, HOLD_MS);
    return () => {
      clearTimeout(hold);
      if (leave) clearTimeout(leave);
    };
  }, [current]);

  if (!current) return null;

  return (
    <div
      className={`achievement-toast${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--toast-gold)] text-[var(--toast-gold)]">
          <Trophy className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="toast-kicker">Achievement unlocked</p>
          <p className="mt-0.5 font-display text-sm font-semibold text-ink">{current.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-dim">{current.detail}</p>
        </div>
      </div>
    </div>
  );
}
