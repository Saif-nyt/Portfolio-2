"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { unlockAchievement } from "@/lib/game";

type Theme = "dark" | "light";

const THEME_EVENT = "pandora:theme-change";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const current = document.documentElement.dataset.theme;
  return current === "light" ? "light" : "dark";
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "theme") callback();
  };
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

function setTheme(next: Theme) {
  const apply = () => {
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
    window.dispatchEvent(new CustomEvent(THEME_EVENT));
    unlockAchievement({
      id: "mood-shift",
      title: "Bioluminescence",
      detail: "The mood has been shifted",
    });
  };

  // Soft palette cross-fade where supported; skipped under reduced motion.
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(apply);
  } else {
    apply();
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);

  const toggle = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-ink transition hover:border-linestrong hover:text-accent ${className}`}
    >
      {theme === "light" ? (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
