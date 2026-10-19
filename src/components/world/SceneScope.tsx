"use client";

import type { ReactNode } from "react";
import { withVars } from "@/lib/styles";

/**
 * Wraps a 3D location's scene + HUD so it can expose the location accent to CSS
 * (`--loc-accent`) without adding a layout box (`display: contents`). The
 * `.world-scope` class derives a daylight-safe `--loc-accent-text` from it so
 * HUD labels stay legible in both themes.
 */
export function SceneScope({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className="contents world-scope" style={withVars({}, { "--loc-accent": accent })}>
      {children}
    </div>
  );
}
