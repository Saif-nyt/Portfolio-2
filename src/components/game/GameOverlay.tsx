"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IntroOverlay } from "@/components/game/IntroOverlay";
import { WORLD_ENTER_EVENT, WORLD_EXIT_EVENT } from "@/lib/game";
import { readStoredMode, setStoredMode } from "@/lib/mode";

type View = "none" | "intro" | "world";

interface GameOverlayProps {
  /** Phase 3 mounts the navigable world here; absent until then. */
  world?: ReactNode;
}

/**
 * Home-entry overlay: first visit shows the NEBULA arrival intro; a stored
 * "immersive" mode opens the world; "quick" never blocks the portfolio.
 * Rendering nothing on the server keeps the conventional home page (and SEO)
 * fully intact underneath.
 */
export function GameOverlay({ world }: GameOverlayProps) {
  // Client-only (ssr: false): storage is readable at first render.
  const [view, setView] = useState<View>(() => {
    // ?world=1 (e.g. from the Navbar "World" button on another route) opens
    // the world immediately, regardless of the stored mode.
    if (typeof window !== "undefined") {
      if (new URLSearchParams(window.location.search).get("world") === "1") {
        return world ? "world" : "intro";
      }
    }
    const stored = readStoredMode();
    if (stored === "quick") return "none";
    if (stored === "immersive") return world ? "world" : "none";
    return "intro";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("world")) return;
    params.delete("world");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  useEffect(() => {
    if (view === "none") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [view]);

  useEffect(() => {
    if (view !== "world") return;
    const onExit = () => setView("none");
    window.addEventListener(WORLD_EXIT_EVENT, onExit);
    return () => window.removeEventListener(WORLD_EXIT_EVENT, onExit);
  }, [view]);

  useEffect(() => {
    const onEnter = () => {
      if (world) setView("world");
    };
    window.addEventListener(WORLD_ENTER_EVENT, onEnter);
    return () => window.removeEventListener(WORLD_ENTER_EVENT, onEnter);
  }, [world]);

  const startExploration = useCallback(() => {
    setStoredMode("immersive");
    setView(world ? "world" : "none");
  }, [world]);

  const chooseQuickPortfolio = useCallback(() => {
    setStoredMode("quick");
    setView("none");
  }, []);

  const dismissIntro = useCallback(() => setView("none"), []);

  if (view === "none") return null;

  if (view === "intro") {
    return (
      <IntroOverlay
        onStart={startExploration}
        onQuickPortfolio={chooseQuickPortfolio}
        onDismiss={dismissIntro}
      />
    );
  }

  return <>{world}</>;
}
