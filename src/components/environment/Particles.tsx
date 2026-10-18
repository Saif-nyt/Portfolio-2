import type { CSSProperties } from "react";

const PARTICLES = [
  { left: "4%", top: "18%", size: 3, dur: "11s", delay: "0s", o: 0.7 },
  { left: "11%", top: "62%", size: 2, dur: "13s", delay: "1.4s", o: 0.5 },
  { left: "17%", top: "34%", size: 4, dur: "9s", delay: "0.6s", o: 0.8 },
  { left: "23%", top: "78%", size: 2, dur: "15s", delay: "2.2s", o: 0.45 },
  { left: "29%", top: "12%", size: 3, dur: "12s", delay: "0.9s", o: 0.65 },
  { left: "36%", top: "55%", size: 2, dur: "16s", delay: "3s", o: 0.5 },
  { left: "43%", top: "26%", size: 5, dur: "10s", delay: "1.1s", o: 0.75 },
  { left: "49%", top: "70%", size: 2, dur: "14s", delay: "2.6s", o: 0.5 },
  { left: "56%", top: "40%", size: 3, dur: "11s", delay: "0.3s", o: 0.7 },
  { left: "63%", top: "82%", size: 2, dur: "17s", delay: "3.4s", o: 0.45 },
  { left: "69%", top: "22%", size: 4, dur: "12s", delay: "1.8s", o: 0.8 },
  { left: "76%", top: "58%", size: 2, dur: "15s", delay: "0.5s", o: 0.5 },
  { left: "83%", top: "30%", size: 3, dur: "10s", delay: "2.9s", o: 0.65 },
  { left: "89%", top: "72%", size: 4, dur: "13s", delay: "1.6s", o: 0.6 },
  { left: "94%", top: "46%", size: 2, dur: "16s", delay: "0.8s", o: 0.5 },
  { left: "7%", top: "88%", size: 3, dur: "14s", delay: "2.4s", o: 0.55 },
  { left: "47%", top: "90%", size: 3, dur: "12s", delay: "3.8s", o: 0.5 },
  { left: "72%", top: "8%", size: 3, dur: "15s", delay: "0.2s", o: 0.6 },
];

/**
 * Luminous spores. Pure static markup animated in CSS — no canvas loop,
 * no client JS, and the particle count shrinks on small screens.
 */
export function Particles({ className = "" }: { className?: string }) {
  return (
    <div className={`scene-particles pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {PARTICLES.map((particle, index) => {
        const style = {
          left: particle.left,
          top: particle.top,
          width: particle.size,
          height: particle.size,
          animationDelay: particle.delay,
          boxShadow: "0 0 10px rgba(99,245,231,0.9)",
          "--tw-dur": particle.dur,
          "--tw-x": index % 2 === 0 ? "6px" : "-5px",
          "--p-o": particle.o,
        } as CSSProperties;

        return (
          <span
            key={index}
            className={`anim-twinkle absolute rounded-full bg-cyan ${
              index > 9 ? "hidden md:block" : index > 5 ? "hidden sm:block" : ""
            }`}
            style={style}
          />
        );
      })}
      <span
        className="anim-twinkle absolute right-[14%] top-[44%] hidden h-1.5 w-1.5 rounded-full bg-turquoise shadow-[0_0_16px_rgba(55,214,197,0.9)] md:block"
        style={{ "--tw-dur": "13s", "--tw-x": "-7px", animationDelay: "1.4s" } as CSSProperties}
      />
      <span
        className="anim-twinkle absolute left-[38%] top-[64%] hidden h-1 w-1 rounded-full bg-mist shadow-[0_0_14px_rgba(163,217,214,0.9)] md:block"
        style={
          { "--tw-dur": "15s", "--tw-x": "5px", animationDelay: "3.5s" } as CSSProperties
        }
      />
    </div>
  );
}
