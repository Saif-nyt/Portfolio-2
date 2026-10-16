import { useId } from "react";
import { withVars } from "@/lib/styles";

/** Distant alien range sitting on the horizon line. */
export function HorizonRange({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      className={`h-full w-full ${className}`}
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`range-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16463F" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#0B1B19" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#07110F" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`back-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#102C28" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#07110F" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <path
        d="M0 168 L96 120 L168 148 L262 92 L346 146 L430 108 L520 158 L622 112 L716 162 L820 118 L918 166 L1022 124 L1122 170 L1226 132 L1330 174 L1440 142 L1440 320 L0 320 Z"
        fill={`url(#back-${id})`}
      />
      <path
        d="M0 226 L120 176 L214 214 L318 158 L420 220 L512 176 L628 236 L740 186 L848 244 L962 196 L1074 250 L1188 204 L1300 254 L1440 210 L1440 320 L0 320 Z"
        fill={`url(#range-${id})`}
      />
      <path
        d="M0 226 L120 176 L214 214 L318 158 L420 220 L512 176 L628 236 L740 186 L848 244 L962 196 L1074 250 L1188 204 L1300 254 L1440 210"
        fill="none"
        stroke="rgba(99,245,231,0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M0 168 L96 120 L168 148 L262 92 L346 146 L430 108 L520 158 L622 112 L716 162 L820 118 L918 166 L1022 124 L1122 170 L1226 132 L1330 174 L1440 142"
        fill="none"
        stroke="rgba(163,217,214,0.2)"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Suspended landmasses drifting above the canopy. */
export function FloatingIslands({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      className={`h-full w-full overflow-visible ${className}`}
      viewBox="0 0 1440 460"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`rock-${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#16463F" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#102C28" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#07110F" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`cap-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#63F5E7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#37D6C5" stopOpacity="0.1" />
        </linearGradient>

        <g id={`island-${id}`}>
          <path
            d="M10 52 C70 36 150 32 214 40 C268 47 312 62 336 82 C322 112 302 148 278 190 C252 236 228 274 210 300 C200 262 184 224 164 190 C138 146 106 112 72 90 C46 74 26 64 10 52 Z"
            fill={`url(#rock-${id})`}
          />
          <path
            d="M10 52 C70 36 150 32 214 40 C268 47 312 62 336 82 C300 74 250 64 200 58 C140 51 70 46 10 52 Z"
            fill={`url(#cap-${id})`}
          />
          <path
            d="M10 52 C70 36 150 32 214 40 C268 47 312 62 336 82"
            fill="none"
            stroke="rgba(99,245,231,0.55)"
            strokeWidth="1.6"
          />
          <path
            d="M92 94 C88 138 98 174 90 212"
            fill="none"
            stroke="rgba(99,245,231,0.45)"
            strokeWidth="1.4"
          />
          <path
            d="M252 122 C256 158 246 192 254 228"
            fill="none"
            stroke="rgba(55,214,197,0.4)"
            strokeWidth="1.2"
          />
          <circle cx="90" cy="214" r="3.4" fill="#63F5E7" className="anim-pulse" />
          <circle
            cx="254"
            cy="230"
            r="2.6"
            fill="#37D6C5"
            className="anim-pulse"
            style={{ animationDelay: "1.1s" }}
          />
          <path d="M138 46 l7 -20 l7 20 z" fill="#63F5E7" className="anim-pulse" />
          <path
            d="M186 40 l6 -17 l6 17 z"
            fill="#37D6C5"
            className="anim-pulse"
            style={{ animationDelay: "2s" }}
          />
          <path
            d="M232 50 l5 -14 l5 14 z"
            fill="#63F5E7"
            className="anim-pulse"
            style={{ animationDelay: "3.2s" }}
          />
        </g>
      </defs>

      <g opacity="0.55" transform="translate(70 34) scale(0.62)">
        <use href={`#island-${id}`} />
      </g>
      <g opacity="0.42" transform="translate(990 12) scale(0.5)">
        <use href={`#island-${id}`} />
      </g>
      <g opacity="0.9" transform="translate(430 108) scale(0.95)">
        <use href={`#island-${id}`} />
      </g>
      <g className="anim-drift" style={withVars({}, { "--drift-x": "14px", "--drift-dur": "34s" })}>
        <g opacity="0.75" transform="translate(1080 150) scale(0.68)">
          <use href={`#island-${id}`} />
        </g>
      </g>
      <g opacity="0.6" transform="translate(210 240) scale(0.4)">
        <use href={`#island-${id}`} />
      </g>
    </svg>
  );
}
