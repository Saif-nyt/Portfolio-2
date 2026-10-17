/** Cloaked explorer token with a bioluminescent core — the player's body. */
export function ExplorerAvatar() {
  return (
    <svg
      viewBox="0 0 36 52"
      className="h-[52px] w-9 overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="explorer-cloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16463F" />
          <stop offset="100%" stopColor="#07110F" />
        </linearGradient>
        <radialGradient id="explorer-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F2F5EF" />
          <stop offset="45%" stopColor="#63F5E7" />
          <stop offset="100%" stopColor="#63F5E7" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="18" cy="50" rx="12" ry="2.6" fill="rgba(7,17,15,0.55)" />

      <path
        d="M18 6 C25 6 29 12 30 22 C31 32 30 42 28 47 L8 47 C6 42 5 32 6 22 C7 12 11 6 18 6 Z"
        fill="url(#explorer-cloak)"
        stroke="rgba(99,245,231,0.55)"
        strokeWidth="1.2"
      />
      <path
        d="M18 6 C14 6 11 9 10 14 C13 11 16 10 18 10 C20 10 23 11 26 14 C25 9 22 6 18 6 Z"
        fill="#0B1B19"
        stroke="rgba(163,217,214,0.4)"
        strokeWidth="1"
      />
      <circle cx="18" cy="26" r="7" fill="url(#explorer-core)" className="anim-pulse" />
      <circle cx="18" cy="26" r="2.2" fill="#F2F5EF" />
      <path
        d="M29 20 L33 12"
        stroke="rgba(99,245,231,0.7)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="33" cy="11" r="3" fill="#63F5E7" className="anim-pulse" />
    </svg>
  );
}
