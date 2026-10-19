"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";
import { readTheme, setTheme, useTheme } from "@/lib/theme";
import { unlockAchievement } from "@/lib/game";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();

  const toggle = useCallback(() => {
    const next = readTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    unlockAchievement({
      id: "mood-shift",
      title: "Bioluminescence",
      detail: "The mood has been shifted",
    });
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
