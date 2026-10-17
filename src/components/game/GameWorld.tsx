"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Map as MapIcon, Volume2, VolumeX } from "lucide-react";
import { AlienFlora } from "@/components/environment/AlienFlora";
import { FloatingIslands, HorizonRange } from "@/components/environment/FloatingMountains";
import { LightRays } from "@/components/environment/LightRays";
import { ControlsGuide } from "@/components/game/ControlsGuide";
import { ExplorerAvatar } from "@/components/game/ExplorerAvatar";
import { Joystick } from "@/components/game/Joystick";
import { MissionLog } from "@/components/game/MissionLog";
import { WorldMap } from "@/components/game/WorldMap";
import { ZoneBeacon } from "@/components/game/ZoneBeacon";
import { INTERACT_RANGE, SPAWN_X, WORLD_WIDTH, ZONES, type Zone } from "@/data/zones";
import { exitWorld } from "@/lib/game";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { completeMission, discoverZone, missionForZone, useMissionProgress } from "@/lib/missions";
import { isSoundEnabled, playBlip, playZoneEnter, setSoundEnabled } from "@/lib/sound";
import { readJson } from "@/lib/storage";

const PLAYER_SPEED = 380;
const WORLD_MARGIN = 60;
const DEPTHS = { range: 0.15, islands: 0.32, mist: 0.5 } as const;
const MIST_X = [600, 2000, 3400, 4700];
const FLORA_X = [80, 1500, 2900, 4300];

const clampX = (x: number) => Math.max(WORLD_MARGIN, Math.min(WORLD_WIDTH - WORLD_MARGIN, x));

/**
 * The navigable 2.5D frontier: layered parallax scenery, a walkable explorer,
 * zone beacons and quick travel. Movement runs on a demand-driven rAF loop
 * that parks itself when the world is still.
 */
export function GameWorld() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const [nearZone, setNearZone] = useState<Zone | null>(null);
  const [walking, setWalking] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPlayerX, setMapPlayerX] = useState(SPAWN_X);
  const [logOpen, setLogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => !readJson("controls-seen", false));
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const progress = useMissionProgress();

  const playerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const islandsRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);

  const playerXRef = useRef(SPAWN_X);
  const velRef = useRef(0);
  const camXRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const joystickRef = useRef(0);
  const moveTargetRef = useRef<number | null>(null);
  const pendingZoneRef = useRef<Zone | null>(null);
  const nearZoneRef = useRef<Zone | null>(null);
  const walkingRef = useRef(false);
  const mapOpenRef = useRef(false);
  const guideOpenRef = useRef(true);
  const logOpenRef = useRef(false);
  const vwRef = useRef(typeof window === "undefined" ? 1280 : window.innerWidth);
  const runningRef = useRef(false);
  const snapCamRef = useRef(true);
  const wakeRef = useRef<() => void>(() => {});
  const openZoneRef = useRef<(zone: Zone) => void>(() => {});

  const openZone = useCallback((zone: Zone) => {
    discoverZone(zone.id);
    const missionId = missionForZone(zone.id);
    if (missionId) completeMission(missionId);
    playZoneEnter();
    exitWorld();
    router.push(zone.href);
  }, [router]);

  useEffect(() => {
    openZoneRef.current = openZone;
  }, [openZone]);

  useEffect(() => {
    completeMission("m01");
    discoverZone("landing");
  }, []);

  useEffect(() => {
    mapOpenRef.current = mapOpen;
    if (mapOpen) {
      keysRef.current = { left: false, right: false };
      joystickRef.current = 0;
      moveTargetRef.current = null;
      pendingZoneRef.current = null;
    }
  }, [mapOpen]);

  useEffect(() => {
    guideOpenRef.current = guideOpen;
  }, [guideOpen]);

  useEffect(() => {
    logOpenRef.current = logOpen;
  }, [logOpen]);

  useEffect(() => {
    vwRef.current = window.innerWidth;

    let raf = 0;
    let last = performance.now();
    let idleTicks = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let input = 0;
      if (!mapOpenRef.current) {
        if (keysRef.current.left) input -= 1;
        if (keysRef.current.right) input += 1;
        if (joystickRef.current !== 0) input = joystickRef.current;
      }
      if (input !== 0) {
        moveTargetRef.current = null;
        pendingZoneRef.current = null;
      }

      let targetVel = input * PLAYER_SPEED;
      if (!mapOpenRef.current && moveTargetRef.current !== null) {
        const dist = moveTargetRef.current - playerXRef.current;
        if (Math.abs(dist) < 6) {
          moveTargetRef.current = null;
          targetVel = 0;
          const pending = pendingZoneRef.current;
          pendingZoneRef.current = null;
          if (pending && Math.abs(pending.x - playerXRef.current) <= INTERACT_RANGE) {
            openZoneRef.current(pending);
          }
        } else {
          targetVel = Math.sign(dist) * PLAYER_SPEED;
        }
      }

      velRef.current += (targetVel - velRef.current) * Math.min(1, dt * 12);
      if (targetVel === 0 && Math.abs(velRef.current) < 1.5) velRef.current = 0;
      playerXRef.current = clampX(playerXRef.current + velRef.current * dt);

      const vw = vwRef.current;
      const camTarget = Math.max(0, Math.min(WORLD_WIDTH - vw, playerXRef.current - vw / 2));
      if (reducedMotion || snapCamRef.current) {
        camXRef.current = camTarget;
        snapCamRef.current = false;
      } else {
        camXRef.current += (camTarget - camXRef.current) * Math.min(1, dt * 7);
        if (Math.abs(camTarget - camXRef.current) < 0.15) camXRef.current = camTarget;
      }

      const cam = camXRef.current;
      if (rangeRef.current) {
        rangeRef.current.style.transform = `translate3d(${-cam * DEPTHS.range}px, 0, 0)`;
      }
      if (islandsRef.current) {
        islandsRef.current.style.transform = `translate3d(${-cam * DEPTHS.islands}px, 0, 0)`;
      }
      if (mistRef.current) {
        mistRef.current.style.transform = `translate3d(${-cam * DEPTHS.mist}px, 0, 0)`;
      }
      if (groundRef.current) {
        groundRef.current.style.transform = `translate3d(${-cam}px, 0, 0)`;
      }
      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(${playerXRef.current}px, 0, 0)`;
      }

      const isWalking = velRef.current !== 0;
      if (isWalking !== walkingRef.current) {
        walkingRef.current = isWalking;
        setWalking(isWalking);
      }

      let nearest: Zone | null = null;
      let best = INTERACT_RANGE;
      for (const zone of ZONES) {
        const distance = Math.abs(zone.x - playerXRef.current);
        if (distance < best) {
          best = distance;
          nearest = zone;
        }
      }
      if (nearest !== nearZoneRef.current) {
        nearZoneRef.current = nearest;
        setNearZone(nearest);
      }

      const moving =
        velRef.current !== 0 ||
        targetVel !== 0 ||
        input !== 0 ||
        moveTargetRef.current !== null;
      if (!moving && camXRef.current === camTarget) {
        idleTicks += 1;
        if (idleTicks > 10) {
          runningRef.current = false;
          return;
        }
      } else {
        idleTicks = 0;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;
    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      runningRef.current = false;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const onResize = () => {
      vwRef.current = window.innerWidth;
      snapCamRef.current = true;
      wakeRef.current();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleBeacon = useCallback((zone: Zone) => {
    if (Math.abs(zone.x - playerXRef.current) <= INTERACT_RANGE) {
      openZoneRef.current(zone);
      return;
    }
    pendingZoneRef.current = zone;
    moveTargetRef.current = zone.x;
    wakeRef.current();
  }, []);

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
          keysRef.current.left = true;
          wakeRef.current();
          break;
        }
        case "KeyD":
        case "ArrowRight": {
          event.preventDefault();
          keysRef.current.right = true;
          wakeRef.current();
          break;
        }
        case "KeyE":
        case "Enter":
        case "Space": {
          if (event.repeat) break;
          event.preventDefault();
          const active = document.activeElement;
          if (active && (active.tagName === "BUTTON" || active.tagName === "A")) break;
          if (nearZoneRef.current) openZoneRef.current(nearZoneRef.current);
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
            wakeRef.current();
          } else exitWorld();
          break;
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyA" || event.code === "ArrowLeft") keysRef.current.left = false;
      if (event.code === "KeyD" || event.code === "ArrowRight") keysRef.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleWorldClick = (event: MouseEvent<HTMLDivElement>) => {
    if (mapOpen || guideOpen) return;
    if ((event.target as HTMLElement).closest("button, a, [role='dialog'], .panel")) return;
    moveTargetRef.current = clampX(Math.round(event.clientX + camXRef.current));
    pendingZoneRef.current = null;
    wakeRef.current();
  };

  const travelTo = (x: number) => {
    playerXRef.current = clampX(x);
    velRef.current = 0;
    moveTargetRef.current = null;
    pendingZoneRef.current = null;
    snapCamRef.current = true;
    setMapOpen(false);
    playBlip();
    wakeRef.current();
  };

  const travelNearZone = (zone: Zone) => travelTo(zone.x - (INTERACT_RANGE - 25));

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playBlip();
  };

  return (
    <div
      role="application"
      aria-label="Nebula exploration world"
      tabIndex={-1}
      ref={(node) => {
        if (node && document.activeElement !== node) node.focus({ preventScroll: true });
      }}
      className="fixed inset-0 z-[70] touch-none overflow-hidden select-none"
      onClick={handleWorldClick}
    >
      <div className="absolute inset-0 scene-sky scene-sky-arrival" aria-hidden="true" />
      <div className="scene-sun" aria-hidden="true" />

      <div
        ref={rangeRef}
        className="absolute bottom-[16%] left-0 h-[34%]"
        style={{ width: WORLD_WIDTH }}
        aria-hidden="true"
      >
        <HorizonRange />
      </div>

      <div
        ref={islandsRef}
        className="absolute top-[4%] left-0 h-[58%]"
        style={{ width: WORLD_WIDTH }}
        aria-hidden="true"
      >
        <FloatingIslands />
      </div>

      <LightRays className="opacity-70" />

      <div
        ref={mistRef}
        className="absolute inset-y-0 left-0"
        style={{ width: WORLD_WIDTH }}
        aria-hidden="true"
      >
        {MIST_X.map((x, index) => (
          <div
            key={x}
            className="anim-drift absolute bottom-[18%] h-44 w-[560px] rounded-full opacity-70"
            style={{
              left: x,
              background:
                "radial-gradient(closest-side, color-mix(in srgb, var(--mist) 14%, transparent), transparent)",
              filter: "blur(28px)",
              animationDelay: `${index * 1.7}s`,
            }}
          />
        ))}
      </div>

      <div
        ref={groundRef}
        className="absolute inset-y-0 left-0"
        style={{ width: WORLD_WIDTH }}
      >
        {FLORA_X.map((x, index) => (
          <div
            key={x}
            className="absolute bottom-[12%] h-[24vh] w-[900px] opacity-85"
            style={{ left: x, transform: `scaleX(${index % 2 === 0 ? 1 : -1})` }}
            aria-hidden="true"
          >
            <AlienFlora />
          </div>
        ))}

        <div
          className="absolute inset-x-0 bottom-0 h-[15%]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--jungle) 72%, transparent), var(--bg) 88%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-[13%] h-[2px] opacity-70"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 38%, transparent) 15%, color-mix(in srgb, var(--accent) 38%, transparent) 85%, transparent)",
          }}
          aria-hidden="true"
        />

        {ZONES.map((zone) => (
          <ZoneBeacon
            key={zone.id}
            zone={zone}
            active={nearZone?.id === zone.id}
            completed={progress.discovered.includes(zone.id)}
            onActivate={() => handleBeacon(zone)}
          />
        ))}

        <div
          ref={playerRef}
          className="absolute bottom-[13%] left-0"
          style={{ transform: `translate3d(${SPAWN_X}px, 0, 0)` }}
        >
          <div className={`-translate-x-1/2 ${walking ? "player-bob" : ""}`}>
            <ExplorerAvatar />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-5">
        <p className="panel hidden rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.28em] text-dim uppercase sm:block">
          NEBULA <span className="text-accent">· FRONTIER</span>
        </p>
        <div className="ml-auto flex gap-2">
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
              setMapPlayerX(playerXRef.current);
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
          onClick={() => handleBeacon(nearZone)}
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
              joystickRef.current = axis;
              wakeRef.current();
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
