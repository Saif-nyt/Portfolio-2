import { useId } from "react";
import type { Project } from "@/types";

const DEEP = "#07110F";
const PANEL = "#0B1B19";
const SURFACE = "#102C28";
const RIDGE = "#16463F";
const MIST = "#A3D9D6";

const ACCENT: Record<Project["accent"], string> = {
  cyan: "#63F5E7",
  turquoise: "#37D6C5",
  mist: "#A3D9D6",
};

interface ArtProps {
  accent: string;
  rid: string;
}

function StorefrontArt({ accent, rid }: ArtProps) {
  return (
    <g>
      <rect x="24" y="64" width="752" height="76" rx="14" fill={`url(#glow-${rid})`} />
      <rect x="48" y="84" width="252" height="16" rx="8" fill={MIST} />
      <rect x="48" y="110" width="176" height="9" rx="4.5" fill={MIST} fillOpacity="0.45" />
      <rect x="628" y="86" width="124" height="34" rx="17" fill={accent} fillOpacity="0.9" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 24 + (i % 3) * 258;
        const y = 160 + Math.floor(i / 3) * 136;
        return (
          <g key={i}>
            <rect x={x} y={y} width="236" height="120" rx="14" fill={SURFACE} />
            <rect x={x + 12} y={y + 12} width="212" height="54" rx="8" fill={RIDGE} fillOpacity="0.7" />
            <circle
              cx={x + 118}
              cy={y + 39}
              r="15"
              fill={accent}
              fillOpacity="0.35"
              className={i === 0 ? "anim-pulse-live" : undefined}
              style={{ animationDelay: `${i * 0.8}s` }}
            />
            <rect x={x + 12} y={y + 78} width={i % 2 === 0 ? 124 : 96} height="9" rx="4.5" fill={MIST} fillOpacity="0.55" />
            <rect x={x + 12} y={y + 96} width="62" height="14" rx="7" fill={accent} fillOpacity="0.85" />
          </g>
        );
      })}
    </g>
  );
}

function CollectionArt({ accent }: Pick<ArtProps, "accent">) {
  const chips = [96, 112, 88, 78];
  return (
    <g>
      <rect x="24" y="64" width="196" height="15" rx="7.5" fill={MIST} fillOpacity="0.8" />
      {chips.map((w, i) => {
        const x = 24 + chips.slice(0, i).reduce((total, chip) => total + chip + 10, 0);
        return (
          <g key={w}>
            <rect
              x={x}
              y="94"
              width={w}
              height="26"
              rx="13"
              fill={i === 0 ? accent : SURFACE}
              fillOpacity={i === 0 ? 0.22 : 1}
              stroke={i === 0 ? accent : RIDGE}
              strokeOpacity={i === 0 ? 0.8 : 1}
            />
            <rect x={x + 14} y="104" width={w - 28} height="6" rx="3" fill={i === 0 ? accent : MIST} fillOpacity={i === 0 ? 0.9 : 0.45} />
          </g>
        );
      })}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const x = 24 + (i % 4) * 192;
        const y = 144 + Math.floor(i / 4) * 146;
        return (
          <g key={i}>
            <rect x={x} y={y} width="176" height="130" rx="12" fill={SURFACE} stroke={i === 2 ? accent : RIDGE} strokeOpacity={i === 2 ? 0.7 : 1} />
            <rect x={x + 10} y={y + 10} width="156" height="72" rx="8" fill={RIDGE} fillOpacity="0.65" />
            <rect x={x + 10} y={y + 94} width="112" height="8" rx="4" fill={MIST} fillOpacity="0.5" />
            <rect x={x + 10} y={y + 110} width="56" height="10" rx="5" fill={accent} fillOpacity="0.8" />
          </g>
        );
      })}
    </g>
  );
}

function TrackingArt({ accent }: Pick<ArtProps, "accent">) {
  const nodes = [
    { x: 40, y: 118, w: 150, label: "Browser" },
    { x: 250, y: 96, w: 150, label: "Meta Pixel" },
    { x: 40, y: 300, w: 150, label: "Server" },
    { x: 250, y: 322, w: 150, label: "Conversion API" },
    { x: 460, y: 209, w: 150, label: "Deduplication" },
    { x: 650, y: 209, w: 126, label: "Reporting" },
  ];
  const paths = [
    "M190 147 C 216 147, 224 125, 250 125",
    "M190 329 C 216 329, 224 351, 250 351",
    "M400 125 C 432 125, 432 224, 460 224",
    "M400 351 C 432 351, 432 252, 460 252",
    "M610 238 H650",
  ];
  return (
    <g>
      {paths.map((d) => (
        <path key={d} d={d} fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="2" className="anim-ants" />
      ))}
      {nodes.map((node) => (
        <g key={node.label}>
          <rect x={node.x} y={node.y} width={node.w} height="58" rx="12" fill={SURFACE} stroke={RIDGE} />
          <text
            x={node.x + node.w / 2}
            y={node.y + 27}
            textAnchor="middle"
            fontSize="13"
            fill={MIST}
          >
            {node.label}
          </text>
          <rect
            x={node.x + 16}
            y={node.y + 38}
            width={node.w - 32}
            height="6"
            rx="3"
            fill={accent}
            fillOpacity="0.55"
          />
        </g>
      ))}
      <circle cx="222" cy="136" r="4" fill={accent} className="anim-pulse-live" />
      <circle
        cx="432"
        cy="238"
        r="4"
        fill={accent}
        className="anim-pulse-live"
        style={{ animationDelay: "0.9s" }}
      />
      <circle
        cx="630"
        cy="238"
        r="4"
        fill={accent}
        className="anim-pulse-live"
        style={{ animationDelay: "1.8s" }}
      />
    </g>
  );
}

function DashboardArt({ accent }: Pick<ArtProps, "accent">) {
  return (
    <g>
      <rect x="0" y="44" width="148" height="406" fill={SURFACE} />
      <rect x="24" y="68" width="100" height="14" rx="7" fill={accent} fillOpacity="0.85" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x="24"
          y={110 + i * 36}
          width={i === 1 ? 100 : 84}
          height="10"
          rx="5"
          fill={i === 1 ? accent : MIST}
          fillOpacity={i === 1 ? 0.75 : 0.35}
        />
      ))}
      <rect x="176" y="66" width="190" height="16" rx="8" fill={MIST} fillOpacity="0.75" />
      <rect x="640" y="62" width="136" height="26" rx="13" fill={accent} fillOpacity="0.18" stroke={accent} strokeOpacity="0.5" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={176 + i * 204} y="104" width="190" height="80" rx="12" fill={PANEL} stroke={RIDGE} />
          <rect x={192 + i * 204} y="122" width="76" height="8" rx="4" fill={MIST} fillOpacity="0.4" />
          <rect x={192 + i * 204} y="142" width="104" height="18" rx="6" fill={accent} fillOpacity={i === 0 ? 0.9 : 0.5} />
        </g>
      ))}
      <rect x="176" y="208" width="598" height="34" rx="8" fill={SURFACE} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={196 + i * 180} y="221" width={i === 0 ? 120 : 84} height="8" rx="4" fill={MIST} fillOpacity="0.5" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x="176"
            y={254 + i * 38}
            width="598"
            height="32"
            rx="8"
            fill={i % 2 === 0 ? PANEL : SURFACE}
            fillOpacity={i % 2 === 0 ? 1 : 0.8}
          />
          <rect x="196" y={265 + i * 38} width="140" height="9" rx="4.5" fill={MIST} fillOpacity="0.55" />
          <rect x="376" y={265 + i * 38} width="90" height="9" rx="4.5" fill={MIST} fillOpacity="0.35" />
          <rect x="556" y={265 + i * 38} width="70" height="9" rx="4.5" fill={MIST} fillOpacity="0.35" />
          <rect x="700" y={263 + i * 38} width="54" height="14" rx="7" fill={accent} fillOpacity={i === 1 ? 0.85 : 0.35} />
        </g>
      ))}
    </g>
  );
}

function LandingArt({ accent }: Pick<ArtProps, "accent">) {
  return (
    <g>
      <rect x="302" y="70" width="196" height="22" rx="11" fill={accent} fillOpacity="0.16" stroke={accent} strokeOpacity="0.5" />
      <rect x="330" y="77" width="140" height="8" rx="4" fill={accent} fillOpacity="0.8" />
      <rect x="170" y="110" width="460" height="22" rx="11" fill={MIST} fillOpacity="0.85" />
      <rect x="214" y="144" width="372" height="22" rx="11" fill={MIST} fillOpacity="0.55" />
      <rect x="262" y="184" width="276" height="10" rx="5" fill={MIST} fillOpacity="0.35" />
      <rect x="266" y="214" width="132" height="40" rx="20" fill={accent} fillOpacity="0.92" />
      <rect x="410" y="214" width="132" height="40" rx="20" fill="none" stroke={RIDGE} strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={`benefit-${i}`}>
          <rect x="96" y={284 + i * 52} width="30" height="30" rx="9" fill={accent} fillOpacity="0.2" stroke={accent} strokeOpacity="0.55" />
          <rect x="142" y={288 + i * 52} width="188" height="9" rx="4.5" fill={MIST} fillOpacity="0.7" />
          <rect x="142" y={305 + i * 52} width="140" height="7" rx="3.5" fill={MIST} fillOpacity="0.3" />
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={`faq-${i}`}>
          <rect x="470" y={284 + i * 52} width="234" height="36" rx="10" fill={SURFACE} stroke={RIDGE} />
          <rect x="486" y={297 + i * 52} width="150" height="9" rx="4.5" fill={MIST} fillOpacity="0.45" />
          <path d={`M676 ${300 + i * 52} l8 8 8 -8`} stroke={accent} strokeWidth="2" fill="none" strokeOpacity="0.8" />
        </g>
      ))}
    </g>
  );
}

function ImmersiveArt({ accent, rid }: ArtProps) {
  return (
    <g>
      <rect x="0" y="44" width="800" height="406" fill={`url(#sky-${rid})`} />
      <ellipse cx="636" cy="128" rx="72" ry="18" fill={RIDGE} fillOpacity="0.85" />
      <path d="M566 132 L636 190 L706 132 Z" fill={SURFACE} />
      <path d="M0 316 L150 196 L280 296 L420 166 L560 296 L690 206 L800 296 L800 450 L0 450 Z" fill={RIDGE} fillOpacity="0.55" />
      <path d="M0 378 L130 296 L270 366 L430 266 L580 366 L710 306 L800 346 L800 450 L0 450 Z" fill={SURFACE} />
      <path d="M0 450 C 44 404, 84 402, 118 450 Z" fill={DEEP} />
      <path d="M646 450 C 678 414, 716 412, 748 450 Z" fill={DEEP} />
      <path d="M744 450 C 772 418, 794 416, 800 450 Z" fill={DEEP} />
      <rect x="60" y="104" width="300" height="22" rx="11" fill={MIST} fillOpacity="0.9" />
      <rect x="60" y="138" width="216" height="22" rx="11" fill={MIST} fillOpacity="0.55" />
      <rect x="60" y="180" width="150" height="11" rx="5.5" fill={accent} fillOpacity="0.85" />
      <circle cx="520" cy="96" r="5" fill={accent} className="anim-pulse-live" />
      <circle
        cx="470"
        cy="238"
        r="4"
        fill={accent}
        className="anim-pulse-live"
        style={{ animationDelay: "1.4s" }}
      />
    </g>
  );
}

function GenericArt({ accent, rid }: ArtProps) {
  return (
    <g>
      <rect x="24" y="64" width="752" height="86" rx="14" fill={`url(#glow-${rid})`} />
      <rect x="48" y="86" width="300" height="18" rx="9" fill={MIST} fillOpacity="0.85" />
      <rect x="48" y="116" width="188" height="9" rx="4.5" fill={MIST} fillOpacity="0.45" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={24 + i * 258} y="182" width="236" height="110" rx="14" fill={SURFACE} />
          <rect x={36 + i * 258} y="194" width="212" height="52" rx="8" fill={RIDGE} fillOpacity="0.7" />
          <rect
            x={36 + i * 258}
            y="258"
            width={i % 2 === 0 ? 124 : 96}
            height="9"
            rx="4.5"
            fill={MIST}
            fillOpacity="0.5"
          />
        </g>
      ))}
      <rect x="24" y="318" width="752" height="88" rx="14" fill={PANEL} stroke={RIDGE} />
      <rect x="48" y="352" width="220" height="10" rx="5" fill={MIST} fillOpacity="0.5" />
      <circle cx="656" cy="362" r="16" fill={accent} fillOpacity="0.5" className="anim-pulse-live" />
    </g>
  );
}

function Interior({ project, accent, rid }: { project: Project; accent: string; rid: string }) {
  switch (project.slug) {
    case "premium-ecommerce-storefront":
      return <StorefrontArt accent={accent} rid={rid} />;
    case "shopify-commerce-experience":
      return <CollectionArt accent={accent} />;
    case "conversion-tracking-architecture":
      return <TrackingArt accent={accent} />;
    case "full-stack-business-dashboard":
      return <DashboardArt accent={accent} />;
    case "high-impact-landing-page":
      return <LandingArt accent={accent} />;
    case "immersive-creative-portfolio":
      return <ImmersiveArt accent={accent} rid={rid} />;
    default:
      return <GenericArt accent={accent} rid={rid} />;
  }
}

export function ProjectPreview({ project, className }: { project: Project; className?: string }) {
  const rawId = useId();
  const rid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const accent = ACCENT[project.accent];

  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`block h-full w-full ${className ?? ""}`}
    >
      <defs>
        <linearGradient id={`glow-${rid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`sky-${rid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={RIDGE} stopOpacity="0.9" />
          <stop offset="100%" stopColor={DEEP} stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="800" height="450" fill={DEEP} />
      <rect width="800" height="44" fill={PANEL} />
      <line x1="0" y1="44" x2="800" y2="44" stroke={RIDGE} />
      <circle cx="26" cy="22" r="5" fill={RIDGE} />
      <circle cx="46" cy="22" r="5" fill={RIDGE} />
      <circle cx="66" cy="22" r="5" fill={accent} fillOpacity="0.55" />
      <rect x="96" y="12" width="300" height="20" rx="10" fill={SURFACE} />
      <rect x="110" y="19" width="130" height="6" rx="3" fill={MIST} fillOpacity="0.35" />
      <rect x="412" y="12" width="20" height="20" rx="6" fill={SURFACE} />
      <rect x="440" y="12" width="20" height="20" rx="6" fill={SURFACE} />
      <rect x="0" y="44" width="800" height="406" fill={PANEL} />
      <Interior project={project} accent={accent} rid={rid} />
    </svg>
  );
}
