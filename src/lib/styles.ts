import type { CSSProperties } from "react";

/**
 * Lets components pass CSS custom properties (animation tuning) while
 * keeping full TypeScript compatibility with React.CSSProperties.
 */
export function withVars(
  base: CSSProperties,
  vars: Record<string, string | number>,
): CSSProperties {
  return { ...base, ...vars } as CSSProperties;
}
