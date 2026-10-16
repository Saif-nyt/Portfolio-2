import { createHash, timingSafeEqual } from "node:crypto";

export type AuthResult = "ok" | "unconfigured" | "unauthorized";

export function adminToken(): string | null {
  return process.env.ADMIN_API_TOKEN?.trim() || null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Timing-safe Bearer token check for write endpoints.
 * Returns "unconfigured" when no ADMIN_API_TOKEN is set — write APIs stay
 * disabled rather than silently open (same honesty rule as the contact form).
 */
export function authorizeAdmin(request: Request): AuthResult {
  const expected = adminToken();
  if (!expected) return "unconfigured";

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return "unauthorized";

  return timingSafeEqual(digest(token), digest(expected)) ? "ok" : "unauthorized";
}
