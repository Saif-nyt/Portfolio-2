/**
 * Analytic height field for the Home frontier.
 *
 * It is deliberately cheap and pure: the terrain mesh, rock placement, forest
 * bands, causeway and the distant temple all sample the same function, so the
 * world stays physically connected instead of looking like props dropped onto
 * a flat plane. The central basin is exactly level so the gate, map and camp
 * remain walkable and readable.
 */

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function homeHeight(x: number, z: number): number {
  const distance = Math.hypot(x, z);
  // The arrival basin is perfectly flat inside ~16m and blends into the wild
  // landscape by ~38m.
  const basin = 1 - smoothstep(16, 38, distance);

  const broadRidge =
    Math.sin(x * 0.028 + Math.sin(z * 0.021) * 1.35) * 2.4 +
    Math.sin(z * 0.047 - x * 0.014) * 1.55 +
    Math.sin((x + z) * 0.012 + 0.7) * 2.1 +
    Math.sin(x * 0.011 - z * 0.026) * 1.2;

  const rolling = broadRidge * smoothstep(19, 62, distance) * 0.9;
  const outerRim = smoothstep(46, 138, distance) * (5.4 + broadRidge * 1.15);

  // The Long Ravine cuts across the approach to the northern ruins. The stone
  // causeway below spans it, so the corridor remains readable from Home.
  const ravine =
    Math.exp(-Math.pow((z + 38) / 6.4, 2)) *
    Math.exp(-Math.pow(x / 27, 2)) *
    8.4;

  // Two deep flanking valleys make the central route feel like a high pass
  // rather than a flat corridor.
  const sideAxis = 31 + Math.sin(z * 0.052) * 7;
  const sideReach = smoothstep(8, 32, -z) * (1 - smoothstep(92, 148, -z));
  const sideCanyons =
    (Math.exp(-Math.pow((x - sideAxis) / 10.5, 2)) +
      Math.exp(-Math.pow((x + sideAxis) / 10.5, 2))) *
    sideReach *
    6.2;

  // The far ridge lifts the temple and the Great Arch above the haze.
  const farRidge =
    smoothstep(56, 92, -z) * (1 - smoothstep(132, 178, -z)) * 5.2;

  const wild = rolling + outerRim - ravine - sideCanyons + farRidge;
  return wild * (1 - basin);
}

/** Approximate terrain normal, used for rock/tree settling and slope colour. */
export function homeSlope(x: number, z: number): number {
  const sample = 1.4;
  const dx = homeHeight(x + sample, z) - homeHeight(x - sample, z);
  const dz = homeHeight(x, z + sample) - homeHeight(x, z - sample);
  return Math.hypot(dx, dz) / (sample * 2);
}
