import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ApiError } from "@/server/api-error";
import type { MediaItem } from "@/types";

/** Extension by MIME type — uploads are limited to safe image formats. */
export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const CONTENT_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(MEDIA_TYPES).map(([type, ext]) => [ext, type]),
);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MEDIA_DIR = path.join(process.cwd(), "data", "media");
const SAFE_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

function isReadOnlyError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function readOnlyError(): ApiError {
  return new ApiError(
    503,
    "storage_readonly",
    "Media storage is read-only on this deployment. Uploads work on a host with a writable filesystem; files already in data/media/ are served normally.",
  );
}

function slugifyBase(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return (
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}

export async function saveMedia(file: File): Promise<MediaItem> {
  const contentType = file.type;
  const ext = MEDIA_TYPES[contentType];
  if (!ext) {
    throw new ApiError(
      415,
      "unsupported_media_type",
      `Upload must be one of: ${Object.keys(MEDIA_TYPES).join(", ")}`,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      413,
      "file_too_large",
      `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new ApiError(400, "empty_file", "Uploaded file is empty");
  }

  const filename = `${slugifyBase(file.name)}-${randomUUID().slice(0, 8)}.${ext}`;
  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(path.join(MEDIA_DIR, filename), buffer);
  } catch (error) {
    if (isReadOnlyError(error)) throw readOnlyError();
    throw error;
  }

  return {
    url: `/media/${filename}`,
    filename,
    size: buffer.byteLength,
    contentType,
    uploadedAt: new Date().toISOString(),
  };
}

export async function listMedia(): Promise<MediaItem[]> {
  let names: string[];
  try {
    names = await fs.readdir(MEDIA_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const items: MediaItem[] = [];
  for (const filename of names.sort()) {
    if (filename.startsWith(".") || filename.endsWith(".tmp")) continue;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_BY_EXT[ext];
    if (!contentType) continue;
    try {
      const stat = await fs.stat(path.join(MEDIA_DIR, filename));
      if (!stat.isFile()) continue;
      items.push({
        url: `/media/${filename}`,
        filename,
        size: stat.size,
        contentType,
        uploadedAt: stat.mtime.toISOString(),
      });
    } catch {
      continue;
    }
  }
  return items;
}

export async function removeMedia(filename: string): Promise<void> {
  const safeName = path.basename(filename);
  if (!SAFE_FILENAME.test(safeName)) {
    throw new ApiError(400, "invalid_filename", "Filename contains unsupported characters");
  }

  try {
    await fs.unlink(path.join(MEDIA_DIR, safeName));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new ApiError(404, "not_found", `No media file named "${safeName}"`);
    }
    if (isReadOnlyError(error)) throw readOnlyError();
    throw error;
  }
}
