import { withVars } from "@/lib/styles";

interface Stem {
  x: number;
  h: number;
  lean: number;
  r: number;
  delay: string;
  dur: string;
}

const BACK_STEMS: Stem[] = [
  { x: 60, h: 140, lean: -34, r: 6, delay: "0s", dur: "7s" },
  { x: 150, h: 190, lean: 26, r: 8, delay: "1.2s", dur: "8.5s" },
  { x: 268, h: 120, lean: -18, r: 5, delay: "2.1s", dur: "6.5s" },
  { x: 372, h: 210, lean: 30, r: 9, delay: "0.6s", dur: "9s" },
  { x: 500, h: 150, lean: -24, r: 6, delay: "3s", dur: "7.5s" },
  { x: 620, h: 178, lean: 20, r: 7, delay: "1.7s", dur: "8s" },
  { x: 748, h: 132, lean: -28, r: 5, delay: "2.6s", dur: "6.8s" },
  { x: 866, h: 200, lean: 24, r: 8, delay: "0.9s", dur: "9.4s" },
  { x: 992, h: 156, lean: -22, r: 6, delay: "3.4s", dur: "7.2s" },
  { x: 1118, h: 186, lean: 28, r: 7, delay: "1.4s", dur: "8.8s" },
  { x: 1244, h: 138, lean: -20, r: 5, delay: "2.4s", dur: "6.4s" },
  { x: 1368, h: 172, lean: -30, r: 7, delay: "0.3s", dur: "8.2s" },
];

const FRONT_STEMS: Stem[] = [
  { x: 24, h: 230, lean: -40, r: 10, delay: "0.4s", dur: "8.6s" },
  { x: 176, h: 268, lean: 34, r: 12, delay: "1.9s", dur: "9.6s" },
  { x: 330, h: 214, lean: -30, r: 9, delay: "2.8s", dur: "7.8s" },
  { x: 470, h: 286, lean: 42, r: 13, delay: "0.8s", dur: "10.4s" },
  { x: 640, h: 226, lean: -36, r: 10, delay: "3.2s", dur: "8.4s" },
  { x: 806, h: 276, lean: 30, r: 12, delay: "1.1s", dur: "9.8s" },
  { x: 964, h: 220, lean: -44, r: 9, delay: "2.2s", dur: "7.6s" },
  { x: 1126, h: 292, lean: 38, r: 13, delay: "0.5s", dur: "10.2s" },
  { x: 1288, h: 236, lean: -32, r: 10, delay: "3.6s", dur: "8.8s" },
  { x: 1418, h: 266, lean: -40, r: 11, delay: "1.5s", dur: "9.2s" },
];

const HEIGHT = 320;

function StemShape({
  stem,
  stroke,
  glow,
  strokeWidth,
  fronds,
}: {
  stem: Stem;
  stroke: string;
  glow: string;
  strokeWidth: number;
  fronds: boolean;
}) {
  const baseY = HEIGHT;
  const topY = baseY - stem.h;
  const tipX = stem.x + stem.lean;
  const d = `M ${stem.x} ${baseY} C ${stem.x + stem.lean * 0.2} ${baseY - stem.h * 0.45}, ${
    stem.x + stem.lean * 0.75
  } ${baseY - stem.h * 0.78}, ${tipX} ${topY}`;

  const frondY = baseY - stem.h * 0.58;
  const frondX = stem.x + stem.lean * 0.55;
  const dir = stem.lean >= 0 ? 1 : -1;

  return (
    <g>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      {fronds ? (
        <>
          <path
            d={`M ${frondX} ${frondY} c ${22 * dir} -14 ${44 * dir} -10 ${58 * dir} 8`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 0.7}
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d={`M ${frondX} ${frondY + 34} c ${18 * dir} -8 ${36 * dir} -4 ${46 * dir} 12`}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 0.6}
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      ) : null}
      <circle
        cx={tipX}
        cy={topY}
        r={stem.r}
        fill={glow}
        className="anim-pulse"
        style={withVars({ animationDelay: stem.delay }, { "--pulse-dur": stem.dur })}
      />
      <circle cx={tipX} cy={topY} r={stem.r * 2.4} fill={glow} opacity="0.16" />
    </g>
  );
}

/**
 * Foreground bioluminescent growth: alien stems, fronds and glowing bulbs.
 * Entirely static SVG animated with CSS — no client JS.
 */
export function AlienFlora({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-full w-full ${className}`}
      viewBox={`0 0 1440 ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="flora-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07110F" stopOpacity="0" />
          <stop offset="65%" stopColor="#07110F" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#050C0B" stopOpacity="0.95" />
        </linearGradient>
        <g id="flora-mound">
          <ellipse cx="720" cy={HEIGHT} rx="820" ry="46" fill="#0B1B19" />
        </g>
      </defs>

      <g opacity="0.6">
        {BACK_STEMS.map((stem, index) => (
          <StemShape
            key={`back-${index}`}
            stem={stem}
            stroke="rgba(55,214,197,0.55)"
            glow="#37D6C5"
            strokeWidth={2}
            fronds={false}
          />
        ))}
      </g>

      <use href="#flora-mound" opacity="0.9" />

      <g>
        {FRONT_STEMS.map((stem, index) => (
          <StemShape
            key={`front-${index}`}
            stem={stem}
            stroke="rgba(99,245,231,0.75)"
            glow="#63F5E7"
            strokeWidth={2.6}
            fronds
          />
        ))}
      </g>

      <rect x="0" y={HEIGHT - 120} width="1440" height="120" fill="url(#flora-ground)" />
    </svg>
  );
}
