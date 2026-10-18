"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Map as MapIcon, Zap } from "lucide-react";
import { HoloPanel } from "@/components/world/HoloPanel";
import { WorldMapOverlay } from "@/components/world/WorldMapOverlay";
import { LOCATION_BY_ID, type LocationId } from "@/lib/world/registry";
import { detectQuality, useWorldState, worldActions } from "@/lib/world/store";
import { MODE_CHANGE_EVENT, readStoredMode, setStoredMode } from "@/lib/mode";

interface WorldShellProps {
  locationId: LocationId;
  /** Full-bleed 3D canvas + hotspots layer. */
  children: ReactNode;
  /** Accessible DOM content mirrored below/over the scene for SEO & fallback. */
  fallbackContent?: ReactNode;
  /** Hide the conventional fallback block while in explore mode (default). */
  hideFallbackInExplore?: boolean;
  accent?: string;
}

/** Cached WebGL capability — checked once, shared across all shells. */
let cachedWebgl: boolean | null = null;
function readWebgl(): boolean {
  if (cachedWebgl !== null) return cachedWebgl;
  try {
    const canvas = document.createElement("canvas");
    cachedWebgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    cachedWebgl = false;
  }
  return cachedWebgl;
}

function subscribeNothing() {
  return () => {};
}

function subscribeModeChange(callback: () => void) {
  window.addEventListener(MODE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(MODE_CHANGE_EVENT, callback);
}

/** Explore mode = anything except an explicit "quick" choice. */
function readExploreMode(): boolean {
  return readStoredMode() !== "quick";
}

/**
 * Persistent chrome for every world location: top HUD (location title, map,
 * quick-mode switch), transition veil between locations, holographic panel host,
 * and a 2D content fallback for SEO / no-WebGL / quick mode.
 */
export function WorldShell({
  locationId,
  children,
  fallbackContent,
  hideFallbackInExplore = true,
  accent = "#63f5e7",
}: WorldShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeObject, mapOpen } = useWorldState();

  // Client-only capabilities via useSyncExternalStore (SSR-safe snapshots).
  // Server snapshot for webglOk is `false`: the server can't know about WebGL,
  // so it must render the SEO/no-JS fallback (which carries the page's <h1>).
  // After hydration React re-reads the real client value and swaps in the scene.
  const webglOk = useSyncExternalStore(subscribeNothing, readWebgl, () => false);
  const exploreMode = useSyncExternalStore(subscribeModeChange, readExploreMode, () => true);

  // Quality tier is detected once when the shell first mounts.
  useEffect(() => {
    worldActions.setQuality(detectQuality());
  }, []);

  const location = LOCATION_BY_ID[locationId];
  const showScene = webglOk && exploreMode;
  const showFallback = !hideFallbackInExplore || !exploreMode || !webglOk;

  const goTo = useCallback(
    (id: LocationId) => {
      const target = LOCATION_BY_ID[id];
      if (!target || target.href === pathname) return;
      worldActions.closePanel();
      worldActions.toggleMap(false);
      router.push(target.href);
    },
    [pathname, router],
  );

  const switchToQuick = useCallback(() => {
    setStoredMode("quick");
  }, []);

  const switchToExplore = useCallback(() => {
    setStoredMode("immersive");
  }, []);

  const siblings = useMemo(
    () => Object.values(LOCATION_BY_ID).filter((entry) => entry.id !== locationId),
    [locationId],
  );

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* ---------- HUD ---------- */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto flex flex-col gap-1">
          <p className="panel rounded-full px-3.5 py-1.5 font-mono text-[0.58rem] tracking-[0.26em] text-dim uppercase">
            {location.number}{" "}
            <span style={{ color: accent }}>· {location.title}</span>
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => worldActions.toggleMap()}
            aria-pressed={mapOpen}
            className="panel flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Map</span>
          </button>
          {showScene ? (
            <button
              type="button"
              onClick={switchToQuick}
              className="panel flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Quick mode</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={switchToExplore}
              className="panel flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Explore mode</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------- Scene layer ----------
          Not aria-hidden: scenes render accessible DOM overlays (h1, CTAs,
          pose controls) as siblings of the 3D canvas. The canvas itself is
          marked aria-hidden inside SceneCanvas. */}
      {showScene ? (
        <div className="fixed inset-0 z-0">{children}</div>
      ) : null}

      {/* ---------- Transition veil (keyed on pathname, auto-fades) ---------- */}
      <AnimatePresence>
        <motion.div
          key={`veil-${pathname}`}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[70]"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${accent}22, #050d0cee 70%)`,
          }}
        />
      </AnimatePresence>

      {/* ---------- Quick-mode / fallback content ---------- */}
      {showFallback && fallbackContent ? (
        <div className="relative z-10">{fallbackContent}</div>
      ) : showScene ? (
        // Explore mode: slim accessible nav strip so keyboard/screen-reader
        // users can always move between locations.
        <nav
          aria-label="World locations"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pr-20 sm:pr-3"
        >
          <ul className="panel pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 scrollbar-none">
            {siblings.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  className="block whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[0.56rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
                >
                  {entry.title.split(" ").slice(-1)[0]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* ---------- Overlays ---------- */}
      <HoloPanel object={activeObject} accent={accent} />
      <WorldMapOverlay open={mapOpen} currentId={locationId} onNavigate={goTo} accent={accent} />
    </div>
  );
}
