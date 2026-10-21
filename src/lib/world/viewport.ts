import * as THREE from "three";

/**
 * Viewport maths shared by every scene.
 *
 * All camera poses in NEBULA are authored against a desktop window, but a
 * phone is tall and narrow: the same *vertical* FOV shows barely half of the
 * authored *horizontal* framing, so doors fill the screen and rows of props
 * read as "too close together". These helpers translate the authored framing
 * into whatever aspect the visitor is actually holding.
 */

/** Aspect the scene compositions were authored against. */
export const REF_ASPECT = 1.6;

/** Vertical FOV ceiling so narrow screens never become fisheye lenses. */
export const MAX_FOV = 78;

/** Phones are held closer to the face — keep a slightly wider base frame. */
export const MOBILE_MIN_FOV = 60;

/**
 * Vertical FOV that preserves the authored horizontal framing at `aspect`,
 * clamped to `[minFov, MAX_FOV]`. Desktop aspects (≥ REF_ASPECT) keep the
 * authored FOV exactly, so nothing about the wide-screen composition moves.
 */
export function resolveSceneFov(baseFov: number, aspect: number, isMobile: boolean): number {
  const safeAspect = Math.max(0.35, aspect);
  const authoredHorizontal = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov) / 2) * REF_ASPECT);
  const vertical = 2 * Math.atan(Math.tan(authoredHorizontal / 2) / safeAspect);
  const minFov = isMobile ? Math.max(baseFov, MOBILE_MIN_FOV) : baseFov;
  return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vertical), minFov, MAX_FOV);
}

/**
 * Extra dolly the exterior "entrance" shot needs on narrow screens. The
 * aspect-aware FOV can only compensate so far before it hits {@link MAX_FOV},
 * so this measures the horizontal framing that is still missing and pushes the
 * camera back by exactly that ratio — capped so a very thin window cannot fling
 * the camera into the horizon. Applied only while the camera holds the entrance
 * pose; interior compositions keep their authored distance.
 */
export function entrancePullScale(baseFov: number, aspect: number, isMobile: boolean): number {
  const safeAspect = Math.max(0.35, aspect);
  const vertical = THREE.MathUtils.degToRad(resolveSceneFov(baseFov, safeAspect, isMobile));
  const actualHorizontal = 2 * Math.atan(Math.tan(vertical / 2) * safeAspect);
  const authoredHorizontal = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov) / 2) * REF_ASPECT);
  const ratio = authoredHorizontal / Math.max(0.001, actualHorizontal);
  return THREE.MathUtils.clamp(ratio, 1, 2.2);
}
