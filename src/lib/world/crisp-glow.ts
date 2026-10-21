import * as THREE from "three";

/**
 * Crisp artifact glow — a MeshStandardMaterial with a tightly-contained
 * Fresnel rim added straight into the emissive term.
 *
 * Why this exists: the old artifact "glow" was additive halo sprites and
 * oversized point lights, which read as fog/cloud around the object. This
 * helper instead brightens only the silhouette band of the mesh itself
 * (grazing-angle Fresnel, powered so the band stays a few pixels wide), so
 * the object reads luminous while its contours and surface detail stay
 * sharp. Everything stays tone-mapped by the renderer's ACES pass, so the
 * glow never clips into a white blob at close range or on mobile DPR.
 */
export interface RimGlowOptions {
  color: THREE.ColorRepresentation;
  emissive: THREE.ColorRepresentation;
  /** Flat body emission (no rim). Kept restrained; the rim carries the glow. */
  emissiveIntensity?: number;
  /** Fresnel contribution at the silhouette. Live-tunable via `setRim`. */
  rimStrength?: number;
  /** Higher = tighter edge band (3–4 keeps it crisp; <2 reads hazy). */
  rimPower?: number;
  roughness?: number;
  metalness?: number;
  flatShading?: boolean;
}

export interface RimGlowMaterial {
  material: THREE.MeshStandardMaterial;
  /** Update rim strength — writes the live uniform, no shader recompile. */
  setRim: (strength: number) => void;
  /** Update the flat body emission. */
  setEmissive: (intensity: number) => void;
  /** Update body emission and rim strength together. */
  setGlow: (emissiveIntensity: number, rimStrength: number) => void;
}

/** Shared program cache key so all rim materials compile one program. */
const RIM_GLOW_CACHE_KEY = "nebula-crisp-rim-glow-v1";

export function createRimGlowMaterial(options: RimGlowOptions): RimGlowMaterial {
  const {
    color,
    emissive,
    emissiveIntensity = 0.5,
    rimStrength = 0.5,
    rimPower = 3.2,
    roughness = 0.3,
    metalness = 0.25,
    flatShading = false,
  } = options;

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness,
    metalness,
    flatShading,
  });

  const rimColor = new THREE.Color(emissive);
  let pendingStrength = rimStrength;
  let rimUniform: { value: number } | null = null;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimStrength = { value: pendingStrength };
    shader.uniforms.uRimPower = { value: rimPower };
    shader.uniforms.uRimColor = { value: rimColor };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRimStrength;
uniform float uRimPower;
uniform vec3 uRimColor;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  vec3 rimViewDir = normalize( vViewPosition );
  float rimFacing = saturate( dot( rimViewDir, normal ) );
  float rimFresnel = pow( 1.0 - rimFacing, uRimPower );
  totalEmissiveRadiance += uRimColor * ( rimFresnel * uRimStrength );
}`,
      );
    rimUniform = shader.uniforms.uRimStrength;
    // The pending value wins if the uniform was written before first compile.
    rimUniform.value = pendingStrength;
  };
  material.customProgramCacheKey = () => RIM_GLOW_CACHE_KEY;

  return {
    material,
    setRim(strength: number) {
      pendingStrength = strength;
      if (rimUniform) rimUniform.value = strength;
    },
    setEmissive(intensity: number) {
      material.emissiveIntensity = intensity;
    },
    setGlow(emissiveIntensity: number, rimStrength: number) {
      material.emissiveIntensity = emissiveIntensity;
      pendingStrength = rimStrength;
      if (rimUniform) rimUniform.value = rimStrength;
    },
  };
}

/**
 * Frame-rate independent exponential damping factor. Used for hover /
 * selection glow so brightness eases in and out instead of snapping —
 * no flicker, no sudden jumps, and a smooth return on deselection.
 */
export function glowDamp(current: number, target: number, delta: number, rate = 12): number {
  const dt = Math.min(delta, 0.05);
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
