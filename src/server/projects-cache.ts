import { cacheLife } from "next/cache";
import { getAllProjects, getProjectBySlug } from "@/server/projects";
import type { Project } from "@/types";

/**
 * Cached accessors used by pages and metadata so prerendering stays static
 * under ensureStatic = "navigation". API route handlers call the uncached
 * service functions directly, so writes are visible immediately over HTTP;
 * pages pick changes up when the cache revalidates (5 minutes).
 */
const PROFILE = { stale: 60, revalidate: 300, expire: 86_400 };

export async function getCachedProjects(): Promise<Project[]> {
  "use cache";
  cacheLife(PROFILE);
  return getAllProjects();
}

export async function getCachedProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife(PROFILE);
  return getProjectBySlug(slug);
}
