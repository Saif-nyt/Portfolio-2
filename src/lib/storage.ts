const PREFIX = "nebula:";

/** True when localStorage is readable/writable (SSR, private mode, quota). */
function storageAvailable(): boolean {
  try {
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Read a JSON value from localStorage; returns fallback on any failure. */
export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Write a JSON value to localStorage; silently no-ops when unavailable. */
export function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined" || !storageAvailable()) return;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage full or blocked — game progress is non-essential.
  }
}
