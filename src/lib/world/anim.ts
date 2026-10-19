export function hash01(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

export function range01(seed: number, min: number, max: number): number {
  return min + hash01(seed) * (max - min);
}

export function valueNoise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash01(i + seed * 131.7);
  const b = hash01(i + 1 + seed * 131.7);
  return a + (b - a) * u;
}

export function fbm1(x: number, seed = 0, octaves = 3): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise1(x * freq, seed + o * 17.3) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

export function wobble(t: number, seed = 0): number {
  return (
    Math.sin(t * 1.0 + seed * 3.1) * 0.55 +
    Math.sin(t * 1.73 + seed * 1.7) * 0.3 +
    Math.sin(t * 2.91 + seed * 0.7) * 0.15
  );
}

export function flicker(t: number, seed = 0): number {
  const slow = fbm1(t * 1.6, seed);
  const fast = fbm1(t * 9.0, seed + 5.1);
  return slow * 0.7 + fast * 0.3;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
