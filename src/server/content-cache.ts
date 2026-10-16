import { cacheLife } from "next/cache";
import { getArticleCategories, getAllArticles, getArticleBySlug } from "@/server/articles";
import { getProcessSteps } from "@/server/process";
import { getSettings } from "@/server/settings";
import { getAllServices } from "@/server/services";
import { getSkillGroups } from "@/server/skills";
import type { Article, ProcessStep, Service, Settings, SkillGroup } from "@/types";

/**
 * Cached accessors used by pages/metadata so prerendering stays static under
 * ensureStatic = "navigation". API route handlers call the uncached services,
 * so writes are visible immediately over HTTP; pages pick changes up when the
 * cache revalidates (5 minutes).
 */
const PROFILE = { stale: 60, revalidate: 300, expire: 86_400 };

export async function getCachedArticles(): Promise<Article[]> {
  "use cache";
  cacheLife(PROFILE);
  return getAllArticles();
}

export async function getCachedArticle(slug: string): Promise<Article | null> {
  "use cache";
  cacheLife(PROFILE);
  return getArticleBySlug(slug);
}

export async function getCachedArticleCategories(): Promise<string[]> {
  "use cache";
  cacheLife(PROFILE);
  return getArticleCategories();
}

export async function getCachedServices(): Promise<Service[]> {
  "use cache";
  cacheLife(PROFILE);
  return getAllServices();
}

export async function getCachedSkillGroups(): Promise<SkillGroup[]> {
  "use cache";
  cacheLife(PROFILE);
  return getSkillGroups();
}

export async function getCachedProcessSteps(): Promise<ProcessStep[]> {
  "use cache";
  cacheLife(PROFILE);
  return getProcessSteps();
}

export async function getCachedSettings(): Promise<Settings> {
  "use cache";
  cacheLife(PROFILE);
  return getSettings();
}
