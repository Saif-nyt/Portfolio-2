import { homeHeight } from "./home-terrain";

/** Eye height above the sampled ground. */
export const HOME_EYE_HEIGHT = 1.72;
/** Body radius used against trees, rocks and structures. */
export const HOME_PLAYER_RADIUS = 0.38;
/** Outer edge of the walkable frontier, just inside the far ridge line. */
export const HOME_BOUNDARY = 128;

export interface HomeSpot {
  position: [number, number, number];
  scale: number;
}

export interface Homestead {
  /** House origin (already seated on the terrain). */
  position: [number, number, number];
  rotation: number;
  scale: number;
  /** Fire pit in the yard, just in front of the porch. */
  fire: [number, number, number];
}

/**
 * Two outlying homesteads. Each has its own fire, path and clearing so the
 * frontier keeps a human scale beyond the central cabin. Keeping them in this
 * data module means visuals, collisions, grass masks and fireflies all agree.
 */
export const HOMESTEADS: Homestead[] = [
  {
    position: [26.5, homeHeight(26.5, -8.5) - 0.12, -8.5],
    rotation: Math.atan2(22 - 26.5, -5.5 + 8.5),
    scale: 1,
    fire: [21, homeHeight(21, -4.8), -4.8],
  },
  {
    position: [-26.5, homeHeight(-26.5, -5.5) - 0.12, -5.5],
    rotation: Math.atan2(-22 + 26.5, -3 + 5.5),
    scale: 0.94,
    fire: [-21, homeHeight(-21, -2.4), -2.4],
  },
];

/**
 * The original fire by the cabin plus one in each homestead yard. Both the
 * visuals and the collision/grass masks read this list, so a fire can never
 * end up embedded in a rock or invisible to the player.
 */
export const CAMPFIRE_SPOTS: HomeSpot[] = [
  { position: [-4, 0, 2.5], scale: 1 },
  ...HOMESTEADS.map((home) => ({ position: home.fire, scale: 0.9 })),
];

export const CAMPFIRE_CLEARINGS = CAMPFIRE_SPOTS.map((spot) => ({
  x: spot.position[0],
  z: spot.position[2],
  r: 4.2,
}));

export const HOUSE_CLEARINGS = HOMESTEADS.map((home) => ({
  x: home.position[0],
  z: home.position[2],
  r: 6.2,
}));

/** Ground routes: gate approach, valley spine, temple road and homestead paths. */
export const HOME_PATHS: [number, number][][] = [
  [[0, 17], [0, 13], [0.25, 9], [-0.45, 6], [0, 2]],
  [[0, 2], [0, -4], [0, -10], [0, -16], [0, -22], [0, -25.5], [0, -27.2]],
  [[0, -49], [0, -52], [-2, -56], [-5, -61], [-8, -66], [-12, -72], [-16, -78], [-20, -82], [-23.5, -84.6]],
  [[0, 2], [-2.2, 2.4], [-4.6, 2.7], [-6.2, 3.1]],
  [[0, 2], [6, 1.4], [12, -0.2], [17.5, -2.2], [20, -3.8]],
  [[0, 2], [-6, 2.6], [-12, 1.7], [-17.5, -0.4], [-20, -1.9]],
];

/** Shortest horizontal distance from a point to the road network. */
export function distanceToHomePath(x: number, z: number): number {
  let best = Infinity;
  for (let route = 0; route < HOME_PATHS.length; route += 1) {
    const points = HOME_PATHS[route];
    for (let i = 0; i < points.length - 1; i += 1) {
      const [ax, az] = points[i];
      const [bx, bz] = points[i + 1];
      const abx = bx - ax;
      const abz = bz - az;
      const lengthSq = abx * abx + abz * abz;
      const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / lengthSq)) : 0;
      const dx = x - (ax + abx * t);
      const dz = z - (az + abz * t);
      const distance = Math.hypot(dx, dz);
      if (distance < best) best = distance;
    }
  }
  return best;
}

const DECK_START_Z = -29;
const DECK_END_Z = -46;
const FAR_RAMP_END_Z = -49;
const DECK_HALF_WIDTH = 2.18;

export function homeIsOnCauseway(x: number, z: number): boolean {
  return (
    Math.abs(x) < DECK_HALF_WIDTH && z <= DECK_START_Z + 0.3 && z >= FAR_RAMP_END_Z - 0.3
  );
}

/** Top surface of the arched stone deck at a given z. */
export function causewayDeckHeight(z: number): number {
  const t = Math.min(1, Math.max(0, (DECK_START_Z - z) / (DECK_START_Z - DECK_END_Z)));
  return 0.72 + Math.sin(t * Math.PI) * 0.62;
}

const RAMP_START_Z = -27;
const RAMP_END_Z = -29;

function smoothstep(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/** Ground height used by walking: the bridge replaces the ravine underfoot. */
export function homeWalkHeight(x: number, z: number): number {
  if (Math.abs(x) < DECK_HALF_WIDTH && z < DECK_END_Z && z >= FAR_RAMP_END_Z) {
    const t = (DECK_END_Z - z) / (DECK_END_Z - FAR_RAMP_END_Z);
    const start = causewayDeckHeight(DECK_END_Z);
    const end = homeHeight(0, FAR_RAMP_END_Z);
    return start + (end - start) * smoothstep(t);
  }
  if (homeIsOnCauseway(x, z)) return causewayDeckHeight(z);
  if (Math.abs(x) < DECK_HALF_WIDTH && z <= RAMP_START_Z && z >= RAMP_END_Z) {
    const t = (RAMP_START_Z - z) / (RAMP_START_Z - RAMP_END_Z);
    const start = homeHeight(0, RAMP_START_Z);
    return start + (causewayDeckHeight(RAMP_END_Z) - start) * smoothstep(t);
  }
  return homeHeight(x, z);
}

/** True inside a clearing where grass and scatter props should stay out. */
export function insideClearing(x: number, z: number, padding = 0): boolean {
  for (let i = 0; i < CAMPFIRE_CLEARINGS.length; i += 1) {
    const clearing = CAMPFIRE_CLEARINGS[i];
    const dx = x - clearing.x;
    const dz = z - clearing.z;
    if (dx * dx + dz * dz < (clearing.r + padding) ** 2) return true;
  }
  for (let i = 0; i < HOUSE_CLEARINGS.length; i += 1) {
    const clearing = HOUSE_CLEARINGS[i];
    const dx = x - clearing.x;
    const dz = z - clearing.z;
    if (dx * dx + dz * dz < (clearing.r + padding) ** 2) return true;
  }
  return false;
}
