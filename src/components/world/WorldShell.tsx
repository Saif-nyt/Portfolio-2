"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Info, Map as MapIcon, Package, X, Zap } from "lucide-react";
import { HoloPanel } from "@/components/world/HoloPanel";
import { WorldCodex } from "@/components/world/WorldCodex";
import { WorldCollection } from "@/components/world/WorldCollection";
import { WorldMapOverlay } from "@/components/world/WorldMapOverlay";
import { WorldNavSurface } from "@/components/world/WorldNavSurface";
import { LOCATION_BY_ID, type LocationId } from "@/lib/world/registry";
import { levelFromXp, progressActions, useProgress } from "@/lib/world/progress";
import { useWorldState, worldActions } from "@/lib/world/store";import { MODE_CHANGE_EVENT, readStoredMode, setStoredMode } from "@/lib/mode";
import { readJson, writeJson } from "@/lib/storage";

interface WorldShellProps {
  locationId: LocationId;
  /** Full-bleed 3D canvas + hotspots layer. */
  children: ReactNode;
  /** Accessible DOM content mirrored below/over the scene for SEO & fallback. */
  fallbackContent?: ReactNode;
  /** Deep content shown inside the codex overlay for this location. */
  codexContent?: ReactNode;
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
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cachedWebgl = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
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

const HINT_KEY = "world-hint";
const LOCATION_NAV_LABELS: Partial<Record<LocationId, string>> = {
  temple: "About",
  observatory: "Skills",
  forge: "Services",
  vault: "Portfolio",
  sanctuary: "Insights",
  nexus: "Contact",
};

/** First-visit explainer pill — shown once per browser until dismissed. */
function WorldHint({ accent }: { accent: string }) {
  // Client-only mount (the scene layer never renders on the server), so the
  // lazy initializer is safe and keeps the effect free of synchronous setState.
  const [visible, setVisible] = useState(() => !readJson<boolean>(HINT_KEY, false));

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 14_000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  const dismiss = useCallback(() => {
    writeJson(HINT_KEY, true);
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none absolute bottom-36 left-3 z-40 flex max-w-[min(20rem,calc(100vw-6rem))] items-start gap-2.5 rounded-2xl border border-line bg-bgdeep/95 px-3.5 py-3 backdrop-blur sm:bottom-24 sm:left-4"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
      <p className="text-xs leading-relaxed text-dim">
        Select the artifacts to explore. Use the world map to travel between locations.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="pointer-events-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
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
  codexContent,
  hideFallbackInExplore = true,
  accent = "#63f5e7",
}: WorldShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeObject, mapOpen, codex, collectionOpen, worldEntry, pendingCodex } = useWorldState();
  const progress = useProgress();
  const level = levelFromXp(progress.xp);

  // Client-only capabilities via useSyncExternalStore (SSR-safe snapshots).
  // The server can't know about WebGL, so its snapshot is `null` and it renders
  // the SEO/no-JS fallback (which carries the page's <h1>). After hydration,
  // React reads the real client value and swaps in the scene.
  const webglState = useSyncExternalStore(
    subscribeNothing,
    readWebgl,
    () => null,
  );
  const webglOk = webglState === true;
  const exploreMode = useSyncExternalStore(subscribeModeChange, readExploreMode, () => true);

  // Record the visit for progression (first-time visits award XP + feed quests).
  useEffect(() => {
    progressActions.visitLocation(locationId);
  }, [locationId]);

  // Walking is a Home-only mode. Arriving at another location always returns
  // that shell to its orbit camera, even when the previous shell was removed
  // before its own route-change cleanup could run.
  useEffect(() => {
    worldActions.setWalkMode(false);
    worldActions.setNearby(null);
  }, [locationId]);

  // Travel (map, strip, link) swaps the shell entirely — close stale overlays
  // so a codex/panel opened in one location never bleeds into the next.
  // Skips the initial mount so a codex deliberately opened *before* travel
  // (e.g. "Discuss this project" → /contact) survives the navigation.
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (worldEntry === "entering") worldActions.completeWorldEntry();
    worldActions.setWalkMode(false);
    worldActions.closePanel();
    worldActions.toggleMap(false);
    worldActions.closeCodex();
    worldActions.toggleCollection(false);
  }, [pathname, worldEntry]);

  // Cross-world actions can queue a codex for the destination (Forge → Contact).
  // Consuming only on a matching pathname keeps the overlay from flashing on
  // the origin page or being destroyed by the transition.
  useEffect(() => {
    if (pendingCodex) worldActions.consumeQueuedCodex(pathname);
  }, [pathname, pendingCodex]);

  // Hide the conventional footer while the world occupies the viewport so
  // scrolling never reveals a standard portfolio underneath the game.
  const location = LOCATION_BY_ID[locationId];
  const showScene = webglOk && exploreMode;
  const showFallback = !hideFallbackInExplore || !exploreMode || !webglOk;
  const homeNavigationVisible =
    locationId !== "arrival" ||
    worldEntry === "inside" ||
    webglState === false ||
    !exploreMode;

  useEffect(() => {
    if (locationId === "arrival" && (webglState === false || !exploreMode)) {
      worldActions.completeWorldEntry();
    }
  }, [locationId, webglState, exploreMode]);

  useEffect(() => {
    document.body.classList.toggle("in-world", showScene);
    return () => {
      document.body.classList.remove("in-world");
    };
  }, [showScene]);

  const goTo = useCallback(
    (id: LocationId) => {
      const target = LOCATION_BY_ID[id];
      if (!target) return;
      // Always dismiss the map, including when the current node is chosen;
      // otherwise the overlay appears to ignore the click.
      worldActions.toggleMap(false);
      if (target.href === pathname) return;
      worldActions.closePanel();
      worldActions.closeCodex();
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
      {/* ---------- HUD ----------
          Sits directly *below* the site navbar (h-16 / md:h-[4.5rem]) so the
          location pill and world controls never land on top of the brand,
          nav links, theme toggle or contact CTA. */}
      {homeNavigationVisible ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex items-start justify-between gap-3 p-3 md:top-[4.5rem] sm:p-4">
        <div className="pointer-events-auto flex flex-col gap-1">
          <p className="panel max-w-[42vw] truncate rounded-full px-3.5 py-1.5 font-mono text-[0.58rem] tracking-[0.26em] text-dim uppercase">
            {location.number}{" "}
            <span style={{ color: accent }}>· {location.title}</span>
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => worldActions.toggleCollection()}
            aria-pressed={collectionOpen}
            aria-label={`Open collection — level ${level} explorer`}
            title="Collection"
            className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            <Package className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden="true" />
            <span className="tabular-nums" style={{ color: accent }}>
              LV {level}
            </span>
          </button>
          <button
            type="button"
            onClick={() => worldActions.toggleMap()}
            aria-pressed={mapOpen}
            aria-label="Open the world map"
            title="World map"
            className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">World map</span>
          </button>
          {showScene ? (
            <button
              type="button"
              onClick={switchToQuick}
              aria-label="Switch to the quick portfolio view"
              title="Quick portfolio"
              className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Quick portfolio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={switchToExplore}
              aria-label="Switch to the 3D explore mode"
              title="Explore mode"
              className="panel flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[0.58rem] tracking-[0.2em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Explore mode</span>
            </button>
          )}
        </div>
        </div>
      ) : null}

      {/* ---------- Scene layer ----------
          In normal flow at exactly one viewport tall instead of `fixed`, so
          scrolling reveals the footer instead of sliding it under an opaque
          canvas, and so the location strip travels with the scene.
          Not aria-hidden: scenes render accessible DOM overlays (h1, CTAs,
          pose controls) as siblings of the 3D canvas. The canvas itself is
          marked aria-hidden inside SceneCanvas. */}
      {showScene ? (
        <WorldNavSurface className="relative h-dvh w-full shrink-0 overflow-hidden">
          {children}

          <AnimatePresence>
            {showScene && homeNavigationVisible && worldEntry !== "entering" ? (
              <WorldHint accent={accent} />
            ) : null}
          </AnimatePresence>

          {/* Slim accessible nav strip: keyboard/screen-reader users can always
              move between locations. Inside the scene so it scrolls away with
              it instead of parking on top of the footer. */}
          {homeNavigationVisible && worldEntry !== "entering" ? (
            <motion.nav
              aria-label="World locations"
              initial={locationId === "arrival" ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-3 pr-24 sm:pr-3"
            >
              <ul className="panel pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 scrollbar-none">
                {siblings.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.href}
                      prefetch={false}
                      className="flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 py-2 font-mono text-[0.56rem] tracking-[0.16em] text-dim uppercase transition hover:text-accent"
                    >
                      {LOCATION_NAV_LABELS[entry.id] ?? entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ) : null}
        </WorldNavSurface>
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
            background: `radial-gradient(circle at 50% 55%, ${accent}22, color-mix(in srgb, var(--bg) 92%, transparent) 70%)`,
          }}
        />
      </AnimatePresence>

      {/* ---------- Quick-mode / fallback content ---------- */}
      {showFallback && fallbackContent ? <div className="relative z-10">{fallbackContent}</div> : null}

      {/* ---------- Overlays ---------- */}
      <HoloPanel object={activeObject} accent={accent} />
      {/* Only host the codex when this location shipped content for it — a
          section opened just before travel (Forge "Discuss") stays in the
          store and appears once the destination shell mounts. */}
      <WorldCodex section={showScene && codexContent ? codex : null} accent={accent}>
        {codexContent}
      </WorldCodex>
      <WorldMapOverlay open={mapOpen} currentId={locationId} onNavigate={goTo} accent={accent} />
      <WorldCollection open={collectionOpen} accent={accent} />
    </div>
  );
}
