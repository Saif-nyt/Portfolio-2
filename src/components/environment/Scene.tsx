import { AlienFlora } from "./AlienFlora";
import { FloatingIslands, HorizonRange } from "./FloatingMountains";
import { LightRays } from "./LightRays";
import { MistLayer } from "./MistLayer";
import { Parallax } from "./Parallax";
import { Particles } from "./Particles";

export type SceneVariant = "arrival" | "quiet" | "gateway";

interface SceneProps {
  variant?: SceneVariant;
  className?: string;
}



/**
 * A composed Pandora environment: sky glow, distant range, suspended
 * islands, volumetric mist, light shafts, foreground flora and spores.
 * Decorative only — always aria-hidden, never blocks interaction.
 */
export function Scene({ variant = "arrival", className = "" }: SceneProps) {
  const showRays = variant !== "quiet";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className={`absolute inset-0 scene-sky-${variant}`} />
      <div className="scene-sun" />

      <div
        className={`scene-art absolute inset-x-0 bottom-[16%] h-[34%] ${variant === "quiet" ? "opacity-60" : "opacity-80"}`}
      >
        <Parallax distance={16}>
          <HorizonRange />
        </Parallax>
      </div>

      <div
        className={`scene-art absolute inset-x-0 top-[4%] h-[64%] ${variant === "quiet" ? "opacity-55" : "opacity-90"}`}
      >
        <Parallax distance={-28}>
          <FloatingIslands />
        </Parallax>
      </div>

      <MistLayer />
      {showRays ? <LightRays className={variant === "gateway" ? "opacity-100" : "opacity-80"} /> : null}

      <div className="scene-art absolute inset-x-0 bottom-0 h-[38%]">
        <Parallax distance={26}>
          <AlienFlora />
        </Parallax>
      </div>

      <Particles className={variant === "quiet" ? "opacity-60" : "opacity-100"} />

      <div
        className="absolute inset-x-0 bottom-0 h-44"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg) 92%)" }}
      />
      <div
        className="absolute inset-x-0 top-0 h-28"
        style={{ background: "linear-gradient(180deg, var(--bg), transparent)" }}
      />
    </div>
  );
}
