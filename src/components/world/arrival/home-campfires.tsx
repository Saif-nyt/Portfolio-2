"use client";

import { useMemo } from "react";
import { hash01 } from "@/lib/world/anim";
import { mixHex, useSceneTheme } from "@/lib/world/scene-theme";
import { Campfire } from "./Campfire";
import { homeHeight } from "./home-terrain";
import { CAMPFIRE_SPOTS } from "./home-world";

type Tier = "high" | "low";

function Clearing({
  x,
  z,
  y,
  radius,
  accent,
}: {
  x: number;
  z: number;
  y: number;
  radius: number;
  accent: string;
}) {
  const palette = useSceneTheme();
  const seats = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const angle = 1.9 + i * 1.95 + hash01(i * 4.3 + x) * 0.4;
        const distance = radius * 0.72;
        const sx = x + Math.cos(angle) * distance;
        const sz = z + Math.sin(angle) * distance;
        return {
          position: [sx, homeHeight(sx, sz) + 0.16, sz] as [number, number, number],
          rotation: [0, -angle, 0] as [number, number, number],
          scale: 0.8 + hash01(i * 7.1 + z) * 0.28,
        };
      }),
    [x, z, radius],
  );

  return (
    <group>
      <mesh position={[x, y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 26]} />
        <meshStandardMaterial color={mixHex(palette.floorDeep, "#66563b", 0.5)} roughness={1} />
      </mesh>
      <mesh position={[x, y + 0.035, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.82, radius * 0.9, 26]} />
        <meshBasicMaterial color={accent} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {seats.map((seat, i) => (
        <group key={i} position={seat.position} rotation={seat.rotation} scale={seat.scale}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.3, 8]} />
            <meshStandardMaterial color={mixHex(palette.stoneDark, "#5c4a34", 0.48)} roughness={1} />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[0, 0.4, 1.52]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 1.1, 6]} />
            <meshStandardMaterial color="#2b1c12" roughness={0.98} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Two additional peaceful clearings. The original fire by the cabin remains
 * part of {@link Campsite}; this component only adds the outer camps.
 */
export function HomeCampfires({ quality, reduced }: { quality: Tier; reduced: boolean }) {
  const palette = useSceneTheme();
  return (
    <group>
      {CAMPFIRE_SPOTS.slice(1).map((spot, index) => {
        const [x, y, z] = spot.position;
        const accent = index === 0 ? "#ffb066" : "#ffcf8a";
        return (
          <group key={`${x}-${z}`}>
            <Clearing x={x} z={z} y={y} radius={3.1} accent={palette.accent(accent)} />
            <Campfire position={[x, y, z]} quality={quality} reduced={reduced} scale={spot.scale} />
          </group>
        );
      })}
    </group>
  );
}
