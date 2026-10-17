"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Map as MapIcon, Volume2, VolumeX } from "lucide-react";
import { ControlsGuide } from "@/components/game/ControlsGuide";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameLoadingScreen } from "@/components/game/GameLoadingScreen";
import { Joystick } from "@/components/game/Joystick";
import { MissionLog } from "@/components/game/MissionLog";
import { WorldFallback } from "@/components/game/WorldFallback";
import { WorldMap } from "@/components/game/WorldMap";
import { WORLD_SCALE, resetWorldInput, worldBridge } from "@/components/game/world-bridge";
import { ZONES, type Zone } from "@/data/zones";
import { exitWorld } from "@/lib/game";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { completeMission, discoverZone, missionForZone, useMissionProgress } from "@/lib/missions";
import { isSoundEnabled, playBlip, playZoneEnter, setSoundEnabled } from "@/lib/sound";
import { readJson } from "@/lib/storage";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Catches render/runtime errors inside the R3F tree and shows the fallback. */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <WorldFallback reason="error" />;
    return this.props.children;
  }
}

/**
 * The navigable frontier. HUD, missions, input and sound stay in the DOM;
 * the world itself is a real-time 3D scene (GameCanvas) sharing state through
 * the worldBridge singleton — no per-frame React renders.
 */
export function GameWorld() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const [nearZone, setNearZone] = useState<Zone | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPlayerX, setMapPlayerX] = useState(380);
  const [logOpen, setLogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => !readJson("controls-seen", false));
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [sceneReady, setSceneReady] = useState(false);
  const [webglOk] = useState(() => hasWebGL());
  const progress = useMissionProgress();

  const openZoneRef = useRef<(zone: Zone) => void>(() => {});
  const mapOpenRef = useRef(false);
  const guideOpenRef = useRef(true);
  const logOpenRef = useRef(false);

  const openZone = useCallback(
    (zone: Zone) => {
      discoverZone(zone.id);
      const missionId = missionForZone(zone.id);
      if (missionId) completeMission(missionId);
      playZoneEnter();
      exitWorld();
      router.push(zone.href);
    },
    [router],
  );

  useEffect(() => {
    openZoneRef.current = openZone;
  }, [openZone]);

  // Wire DOM→scene callbacks and capability flags into the shared bridge.
  useEffect(() => {
    worldBridge.onNearZone = (id) => {
      setNearZone(id ? (ZONES.find((zone) => zone.id === id) ?? null) : null);
    };
    worldBridge.onWalkingChange = () => {};
    worldBridge.onSceneReady = () => setSceneReady(true);
    worldBridge.onActivateZone = (zone) => openZoneRef.current(zone);
    return () => {
      worldBridge.onNearZone = () => {};
      worldBridge.onWalkingChange = () => {};
      worldBridge.onSceneReady = () => {};
      worldBridge.onActivateZone = () => {};
      resetWorldInput();
    };
  }, []);

  useEffect(() => {
    worldBridge.reducedMotion = reducedMotion;
    worldBridge.isMobile = isMobile;
  }, [reducedMotion, isMobile]);

  useEffect(() => {
    completeMission("m01");
    discoverZone("landing");
  }, []);

  useEffect(() => {
    mapOpenRef.current = mapOpen;
    if (mapOpen) resetWorldInput();
  }, [mapOpen]);

  useEffect(() => {
    guideOpenRef.current = guideOpen;
  }, [guideOpen]);

  useEffect(() => {
    logOpenRef.current = logOpen;
  }, [logOpen]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA"));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft": {
          event.preventDefault();
          worldBridge.keys.left = true;
          break;
        }
        case "KeyD":
        case "ArrowRight": {
          event.preventDefault();
          worldBridge.keys.right = true;
          break;
        }
        case "KeyW":
        case "ArrowUp": {
          event.preventDefault();
          worldBridge.keys.forward = true;
          break;
        }
        case "KeyS":
        case "ArrowDown": {
          event.preventDefault();
          worldBridge.keys.back = true;
          break;
        }
        case "KeyE":
        case "Enter":
        case "Space": {
          if (event.repeat) break;
          event.preventDefault();
          const active = document.activeElement;
          if (active && (active.tagName === "BUTTON" || active.tagName === "A")) break;
          const zoneId = worldBridge.nearZoneId;
          if (zoneId) {
            const zone = ZONES.find((entry) => entry.id === zoneId);
            if (zone) openZoneRef.current(zone);
          }
          break;
        }
        case "KeyM": {
          if (event.repeat) break;
          setMapOpen((open) => !open);
          break;
        }
        case "Escape": {
          if (mapOpenRef.current) setMapOpen(false);
          else if (logOpenRef.current) setLogOpen(false);
          else if (guideOpenRef.current) {
            setGuideOpen(false);
          } else exitWorld();
          break;
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyA" || event.code === "ArrowLeft") worldBridge.keys.left = false;
      if (event.code === "KeyD" || event.code === "ArrowRight") worldBridge.keys.right = false;
      if (event.code === "KeyW" || event.code === "ArrowUp") worldBridge.keys.forward = false;
      if (event.code === "KeyS" || event.code === "ArrowDown") worldBridge.keys.back = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playBlip();
  };

  const travelTo = (xPx: number) => {
    worldBridge.teleport = { x: xPx * WORLD_SCALE, z: 0 };
    setMapOpen(false);
    playBlip();
  };

  const travelNearZone = (zone: Zone) => travelTo(zone.x - 125);

  if (!webglOk) {
    return <WorldFallback reason="webgl" />;
  }

  return (
    <div
      role="application"
      aria-label="Nebula exploration world"
      tabIndex={-1}
      ref={(node) => {
        if (node && document.activeElement !== node) node.focus({ preventScroll: true });
      }}
      className="fixed inset-0 z-[70] touch-none overflow-hidden select-none"
    >
      <SceneErrorBoundary>
        <GameCanvas
          natureDensity={isMobile ? 0.55 : 1}
          shadows={!isMobile}
          sporeCount={isMobile ? 48 : 130}
        />
      </SceneErrorBoundary>

      {!sceneReady ? <GameLoadingScreen /> : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-5">
        <p className="panel rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.28em] text-dim uppercase">
          NEBULA <span className="text-accent">· FRONTIER</span>
        </p>
        <div className="pointer-events-auto ml-auto flex gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute sound" : "Enable sound"}
            className="panel flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            {soundOn ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundOn ? "Sound" : "Muted"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMapPlayerX(Math.round(worldBridge.playerX / WORLD_SCALE));
              setMapOpen(true);
            }}
            className="panel flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Map
          </button>
          <button
            type="button"
            onClick={() => exitWorld()}
            className="panel flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.22em] text-dim uppercase transition hover:border-linestrong hover:text-accent"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Exit
          </button>
        </div>
      </div>

      {nearZone && !isMobile && !mapOpen && !guideOpen ? (
        <div className="panel pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full px-5 py-2.5 font-display text-sm">
          <span className="mr-2 rounded-full border border-line px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-accent">
            E
          </span>
          Enter {nearZone.title}
        </div>
      ) : null}

      {nearZone && isMobile && !mapOpen && !guideOpen ? (
        <button
          type="button"
          onClick={() => openZone(nearZone)}
          className="btn-primary absolute right-5 bottom-28 z-30 h-16 w-16 !rounded-full !p-0"
          aria-label={`Enter ${nearZone.title}`}
        >
          <span className="font-mono text-[0.58rem] tracking-[0.18em] uppercase">Enter</span>
        </button>
      ) : null}

      {isMobile && !mapOpen && !guideOpen ? (
        <div className="absolute bottom-6 left-5 z-30">
          <Joystick
            onChange={(axis) => {
              worldBridge.joystick = axis;
            }}
          />
        </div>
      ) : null}

      <MissionLog open={logOpen} onToggle={() => setLogOpen((open) => !open)} />

      {mapOpen ? (
        <WorldMap
          zones={ZONES}
          playerX={mapPlayerX}
          completedIds={progress.discovered}
          onTravel={travelNearZone}
          onTravelTo={travelTo}
          onClose={() => setMapOpen(false)}
        />
      ) : null}

      {guideOpen && !mapOpen ? (
        <ControlsGuide isMobile={isMobile} onClose={() => setGuideOpen(false)} />
      ) : null}
    </div>
  );
}
