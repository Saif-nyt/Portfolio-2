import { distantHorizonColliders } from "@/components/world/DistantHorizon";
import { forestTrees, rockSpires } from "./HomeLandscape";
import { CAMPFIRE_SPOTS, HOMESTEADS } from "./home-world";

export interface HomeCollider {
  x: number;
  z: number;
  r: number;
}

/**
 * Static circular footprints for everything solid inside the walkable
 * frontier. Trees only block at the trunk; their canopies are overhead.
 */
export function homeColliders(quality: "high" | "low"): HomeCollider[] {
  const colliders: HomeCollider[] = distantHorizonColliders(1.25, quality);

  for (const tree of forestTrees(quality)) {
    colliders.push({ x: tree.x, z: tree.z, r: 0.42 + tree.spread * 0.06 });
  }
  for (const spire of rockSpires(quality)) {
    colliders.push({ x: spire.x, z: spire.z, r: spire.radius * 0.82 });
  }

  // Home gate columns (the centre opening stays walkable).
  colliders.push({ x: -4.74, z: 17, r: 0.95 });
  colliders.push({ x: 4.74, z: 17, r: 0.95 });
  // Central map pedestal.
  colliders.push({ x: 0, z: 0, r: 1.15 });
  // Cabin footprint.
  colliders.push({ x: -6.6, z: 3.3, r: 2.25 });
  // Causeway pylons.
  colliders.push({ x: -3.1, z: -29, r: 0.55 });
  colliders.push({ x: 3.1, z: -29, r: 0.55 });
  // Far landmark structures.
  colliders.push({ x: -26, z: -86, r: 11 });
  colliders.push({ x: -9.5, z: -108, r: 4.4 });
  colliders.push({ x: 9.5, z: -108, r: 4.4 });

  for (const fire of CAMPFIRE_SPOTS) {
    colliders.push({ x: fire.position[0], z: fire.position[2], r: 1.05 * fire.scale });
  }

  for (const home of HOMESTEADS) {
    colliders.push({ x: home.position[0], z: home.position[2], r: 3.35 * home.scale });
  }

  return colliders;
}
