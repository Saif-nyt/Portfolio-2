import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Multi-collection JSON file store backing the backend API and the rendered
 * pages. Reads are cached per collection against the file mtime; writes are
 * atomic (temp file + rename) and serialized through one queue.
 *
 * Collections live as `<name>.json` in the repo's data/ directory:
 * projects, articles, services, skills, process, settings.
 */
const DATA_DIR = path.join(process.cwd(), "data");

const COLLECTIONS = ["projects", "articles", "services", "skills", "process", "settings"] as const;
export type Collection = (typeof COLLECTIONS)[number];

const VALID = new Set<string>(COLLECTIONS);

interface CacheEntry {
  mtimeMs: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();
let writeQueue: Promise<void> = Promise.resolve();

function fileFor(name: Collection): string {
  if (!VALID.has(name)) throw new Error(`Unknown collection "${name}"`);
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readCollection<T>(name: Collection): Promise<T> {
  const file = fileFor(name);
  const stat = await fs.stat(file);
  const cached = cache.get(name);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return structuredClone(cached.value) as T;
  }
  const raw = await fs.readFile(file, "utf8");
  const value = JSON.parse(raw) as T;
  cache.set(name, { mtimeMs: stat.mtimeMs, value: structuredClone(value) });
  return value;
}

export function writeCollection<T>(name: Collection, value: T): Promise<void> {
  const file = fileFor(name);
  writeQueue = writeQueue.then(async () => {
    const payload = `${JSON.stringify(value, null, 2)}\n`;
    const tempPath = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, payload, "utf8");
    await fs.rename(tempPath, file);
    const stat = await fs.stat(file);
    cache.set(name, { mtimeMs: stat.mtimeMs, value: structuredClone(value) });
  });
  return writeQueue;
}
