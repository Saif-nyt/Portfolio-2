import { withVars } from "@/lib/styles";

const RAYS = [
  { left: "12%", width: "5.5rem", rotate: "16deg", dur: "14s", delay: "0s", opacity: 0.28 },
  { left: "34%", width: "8rem", rotate: "9deg", dur: "18s", delay: "2s", opacity: 0.34 },
  { left: "58%", width: "4.5rem", rotate: "20deg", dur: "16s", delay: "4s", opacity: 0.22 },
  { left: "78%", width: "6.5rem", rotate: "13deg", dur: "20s", delay: "1s", opacity: 0.3 },
];

/** Volumetric light shafts descending through the canopy. */
export function LightRays({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {RAYS.map((ray, index) => (
        <span
          key={index}
          className="anim-beam absolute -top-[15%] h-[125%] origin-top"
          style={withVars(
            {
              left: ray.left,
              width: ray.width,
              opacity: ray.opacity,
              background:
                "linear-gradient(180deg, rgba(99,245,231,0.5) 0%, rgba(99,245,231,0.12) 45%, transparent 85%)",
              transform: `rotate(${ray.rotate})`,
              transformOrigin: "top center",
              filter: "blur(6px)",
            },
            {
              "--beam-r": ray.rotate,
              "--beam-dur": ray.dur,
              animationDelay: ray.delay,
            },
          )}
        />
      ))}
    </div>
  );
}
