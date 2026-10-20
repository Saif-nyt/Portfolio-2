"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * Palette bridge between the DOM theme and the WebGL world.
 *
 * The world is the same place in both modes — only the light changes. Dark is a
 * bioluminescent night; light is the same architecture lit by warm daylight
 * (limestone, ivory, sand, muted teal). Scenes read a {@link ScenePalette} so
 * every surface, fog bank and light responds to the toggle instead of staying
 * permanently midnight.
 */

export interface ScenePalette {
  theme: Theme;
  isLight: boolean;
  /** Sky / clear colour behind the scene. */
  bg: string;
  /** Exponential fog colour. */
  fog: string;
  fogDensity: number;
  /** Structural stone: base, crevice, and sunlit highlight. */
  stone: string;
  stoneDark: string;
  stoneLight: string;
  /** Floor tone and its deeper inlay. */
  floor: string;
  floorDeep: string;
  /** Aged metal / mechanism tone. */
  metal: string;
  /** Pedestal / plinth tone. */
  plinth: string;
  /** Ambient + hemisphere light configuration. */
  ambient: string;
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  /** Key (sun) light. */
  key: string;
  keyIntensity: number;
  fillIntensity: number;
  /** Ambient dust mote colour. */
  mote: string;
  /** Multiplier for emissive glow so daylight doesn't blow out. */
  glow: number;
  /** Blend mode for additive effects (additive at night, normal by day). */
  effectBlending: THREE.Blending;
  /** A version of a location accent that stays legible on this background. */
  accent: (hex: string) => string;
}

/* ------------------------------------------------------------------ */
/* Colour maths                                                        */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full.slice(0, 6), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix two hex colours. `t` = 0 returns `a`, `t` = 1 returns `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Darken a colour toward the abyss so neon stays readable in daylight. */
function readableAccent(hex: string, isLight: boolean): string {
  return isLight ? mixHex(hex, "#123a33", 0.55) : hex;
}

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

interface LightTint {
  bg?: string;
  fog?: string;
}

const DARK: Omit<ScenePalette, "theme" | "isLight" | "accent"> = {
  bg: "#050d0c",
  fog: "#07110f",
  fogDensity: 0.024,
  stone: "#243b35",
  stoneDark: "#16241f",
  stoneLight: "#33544a",
  floor: "#152723",
  floorDeep: "#0e2c28",
  metal: "#2a3b38",
  plinth: "#1c2f2a",
  ambient: "#9fd8d2",
  ambientIntensity: 0.4,
  hemisphereSky: "#0d3330",
  hemisphereGround: "#050f0d",
  hemisphereIntensity: 0.45,
  key: "#cfeee8",
  keyIntensity: 0.95,
  fillIntensity: 0.16,
  mote: "#cfe9f2",
  glow: 1,
  effectBlending: THREE.AdditiveBlending,
};

const LIGHT_BASE: Omit<ScenePalette, "theme" | "isLight" | "accent"> = {
  bg: "#dfdacb",
  fog: "#e8e3d4",
  fogDensity: 0.02,
  stone: "#c9c3b1",
  stoneDark: "#a7a190",
  stoneLight: "#e3dece",
  floor: "#d3ccb8",
  floorDeep: "#c1b9a4",
  metal: "#b3ad9f",
  plinth: "#c4bda9",
  ambient: "#fff3dc",
  ambientIntensity: 0.9,
  hemisphereSky: "#fdf6e6",
  hemisphereGround: "#b9b19c",
  hemisphereIntensity: 0.75,
  key: "#fff1d4",
  keyIntensity: 1.25,
  fillIntensity: 0.22,
  mote: "#d8c9a0",
  glow: 0.62,
  effectBlending: THREE.NormalBlending,
};

function build(theme: Theme, light: LightTint | undefined): ScenePalette {
  const isLight = theme === "light";
  const base = isLight
    ? { ...LIGHT_BASE, bg: light?.bg ?? LIGHT_BASE.bg, fog: light?.fog ?? LIGHT_BASE.fog }
    : DARK;
  return {
    theme,
    isLight,
    ...base,
    accent: (hex: string) => readableAccent(hex, isLight),
  };
}

/**
 * Theme-aware palette for a 3D scene. `light` optionally tints the daylight sky
 * so each location keeps its own character (warm forge, cool observatory, …).
 */
export function useSceneTheme(light?: LightTint): ScenePalette {
  const theme = useTheme();
  const bg = light?.bg;
  const fog = light?.fog;
  return useMemo(
    () => build(theme, bg === undefined && fog === undefined ? undefined : { bg, fog }),
    [theme, bg, fog],
  );
}

/** Non-hook accessor for imperative code that already knows the theme. */
export function scenePalette(theme: Theme, light?: LightTint): ScenePalette {
  return build(theme, light);
}
