import { NextResponse } from "next/server";
import { ApiError } from "@/server/api-error";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function jsonError(status: number, code: string, message: string, details?: unknown): NextResponse {
  const body: ErrorBody = { error: { code, message, ...(details !== undefined ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

/** errno codes a read-only/serverless filesystem answers when a write is attempted. */
const FS_WRITE_FAILURES = new Set(["EROFS", "EACCES", "EPERM", "ENOTDIR", "ENOSPC", "EDQUOT"]);

export function apiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code && FS_WRITE_FAILURES.has(code)) {
    console.error(`[api] storage write failed (${code}):`, error);
    return jsonError(
      503,
      "storage_readonly",
      "This deployment's filesystem is read-only: changes cannot be saved here. Update the JSON stores in the repository and redeploy, or deploy on a host with writable storage.",
    );
  }
  console.error("[api] unhandled error:", error);
  return jsonError(500, "internal_error", "Something went wrong on the server");
}

export function invalidJsonError(): NextResponse {
  return jsonError(400, "invalid_json", "Request body must be valid JSON");
}

export function apiAuthError(result: "unconfigured" | "unauthorized"): NextResponse {
  if (result === "unconfigured") {
    return jsonError(
      503,
      "admin_disabled",
      "Write access is disabled: ADMIN_API_TOKEN is not configured on this server",
    );
  }
  return jsonError(401, "unauthorized", "Missing or invalid Bearer token");
}

/** Short shared cache for public collection responses. */
export const listCacheHeaders = {
  "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
};
