import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

/**
 * Serves uploaded media from data/media/ at runtime.
 *
 * Runtime-added files in public/ are not picked up by `next start`, so media
 * is stored in data/media/ (the same writable server data the JSON stores use)
 * and streamed by this handler with hardened headers.
 */
const MEDIA_DIR = path.join(process.cwd(), "data", "media");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const SAFE_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const safeName = path.basename(decodeURIComponent(file));

  if (!SAFE_FILENAME.test(safeName) || safeName.startsWith(".")) {
    return new NextResponse(null, { status: 404 });
  }

  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new NextResponse(null, { status: 404 });

  try {
    const data = await fs.readFile(path.join(MEDIA_DIR, safeName));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "content-length": String(data.byteLength),
        "x-content-type-options": "nosniff",
        // Media responses are never treated as active documents (SVG safety).
        "content-security-policy": "sandbox; default-src 'none'",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("[media] read failed:", error);
    return new NextResponse(null, { status: 500 });
  }
}
