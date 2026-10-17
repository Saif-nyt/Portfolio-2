export default function Loading() {
  return (
    <div
      className="flex min-h-[100svh] flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      <p className="eyebrow">Establishing uplink</p>
      <div className="uplink-bar h-px w-44 overflow-hidden bg-line">
        <span className="block h-px w-full bg-accent" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
