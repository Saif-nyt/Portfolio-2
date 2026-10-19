"use client";

import { useMemo } from "react";
import { hash01 } from "@/lib/world/anim";
import { useSceneTheme, mixHex } from "@/lib/world/scene-theme";
import { Cabin } from "./Cabin";
import { Campfire } from "./Campfire";

interface CampsiteProps {
  quality: "high" | "low";
  reduced: boolean;
}

const CABIN_POS: [number, number, number] = [-6.6, 0, 3.3];
const CABIN_ROT = 1.82;
const FIRE_POS: [number, number, number] = [-4.0, 0, 2.5];

export function Campsite({ quality, reduced }: CampsiteProps) {
  const palette = useSceneTheme();
  const seats = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const a = 2.2 + i * 1.5 + hash01(i * 3.1) * 0.3;
        const r = 1.7 + hash01(i * 5.7) * 0.35;
        return {
          pos: [FIRE_POS[0] + Math.cos(a) * r, 0.14, FIRE_POS[2] + Math.sin(a) * r] as [number, number, number],
          rot: [0, Math.atan2(Math.cos(a) * r, Math.sin(a) * r), 0] as [number, number, number],
        };
      }),
    [],
  );

  return (
    <group>
      <mesh position={[FIRE_POS[0], 0.015, FIRE_POS[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 24]} />
        <meshStandardMaterial color={mixHex(palette.floorDeep, "#6b5a3f", 0.5)} roughness={1} metalness={0} />
      </mesh>

      <Cabin position={CABIN_POS} rotationY={CABIN_ROT} reduced={reduced} quality={quality} />
      <Campfire position={FIRE_POS} quality={quality} reduced={reduced} />

      {seats.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.3, 9]} />
          <meshStandardMaterial color={mixHex(palette.stoneDark, "#5a4630", 0.55)} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
