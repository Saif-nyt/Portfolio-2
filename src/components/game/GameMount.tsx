"use client";

import dynamic from "next/dynamic";

const GameOverlay = dynamic(
  () => import("@/components/game/GameOverlay").then((mod) => mod.GameOverlay),
  { ssr: false, loading: () => null },
);

const GameWorld = dynamic(
  () => import("@/components/game/GameWorld").then((mod) => mod.GameWorld),
  { ssr: false, loading: () => null },
);

/** Defers the game layer to a client chunk so the home page stays static HTML. */
export function GameMount() {
  return <GameOverlay world={<GameWorld />} />;
}
