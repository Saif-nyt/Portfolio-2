import { readJson, writeJson } from "@/lib/storage";

/**
 * Tiny WebAudio blip kit for game feedback. Off by default: the preference
 * lives at `nebula:sound` and every play is a no-op until it is turned on.
 * No files, no network — short oscillator envelopes only.
 */

const KEY = "sound";
const VOLUME = 0.05;

let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  return readJson<boolean>(KEY, false) === true;
}

export function setSoundEnabled(enabled: boolean): void {
  writeJson(KEY, enabled);
}

function tone(frequency: number, durationMs: number, delayMs = 0): void {
  if (!isSoundEnabled() || typeof window === "undefined") return;
  try {
    const AudioCtor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    ctx = ctx ?? new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();

    const start = ctx.currentTime + delayMs / 1000;
    const end = start + durationMs / 1000;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(VOLUME, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  } catch {
    // Audio unavailable (policy, hardware) — game stays silent.
  }
}

/** Short confirmation click (toggles, map travel). */
export function playBlip(): void {
  tone(660, 60);
}

/** Two-note arpeggio when the explorer enters a zone. */
export function playZoneEnter(): void {
  tone(523, 90);
  tone(784, 140, 80);
}

/** Rising pair for achievement unlocks. */
export function playAchievement(): void {
  tone(659, 100);
  tone(988, 200, 100);
}
