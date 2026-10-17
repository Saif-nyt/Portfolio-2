/** DOM loading overlay shown while 3D assets stream in behind the canvas. */
export function GameLoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[var(--bg)]"
      role="status"
      aria-live="polite"
      aria-label="Loading the Nebula world"
    >
      <div className="flex flex-col items-center gap-5">
        <p className="font-mono text-[0.65rem] tracking-[0.32em] text-dim uppercase">
          NEBULA <span className="text-accent">· FRONTIER</span>
        </p>
        <div className="relative h-1 w-56 overflow-hidden rounded-full bg-line">
          <span className="uplink-sweep absolute inset-y-0 w-1/3 rounded-full bg-accent" />
        </div>
        <p className="text-sm text-faint">Materialising the frontier…</p>
      </div>
    </div>
  );
}
