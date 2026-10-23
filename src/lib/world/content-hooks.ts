"use client";

import { useCallback, useEffect, useState } from "react";

export type ResourceStatus = "loading" | "ready" | "error";

export interface Resource<T> {
  data: T[];
  status: ResourceStatus;
  /** Re-runs the request — used by error/retry states. */
  reload: () => void;
}

export interface ProjectSummary {
  slug: string;
  index?: string;
  title: string;
  category: string;
  categoryLabel?: string;
  stack?: string[];
  summary: string;
  kind?: string;
  accent?: string;
  tools?: string[];
  services?: string[];
  role?: string;
  problem?: string;
  results?: string | null;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt?: string;
  summary?: string;
  description?: string;
  date?: string;
  readingTime?: string;
  category?: string;
  status?: string;
}

/**
 * Client-side content fetchers for the3D location scenes. The conventional
 * pages still server-render the same data; these hooks only run inside the
 * explore-mode canvas so they never block first paint.
 *
 * Every list endpoint answers `{ items, pagination }` — read `items` first
 * and fall back to legacy collection keys so a shape change can never leave
 * a scene silently empty.
 */
function pickList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const record = data as Record<string, unknown> | null;
  const items = record?.items ?? record?.[key];
  return Array.isArray(items) ? (items as T[]) : [];
}

/**
 * Shared client fetch with an explicit lifecycle so scenes can distinguish
 * "still loading", "loaded but empty" and "failed" instead of silently
 * rendering an empty room. `key` is the legacy collection key some endpoints
 * used before the `{ items }` shape. `enabled` (default true) defers the
 * request until an overlay or scene actually needs the data.
 */
function useResource<T>(url: string, key: string, enabled = true): Resource<T> {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<ResourceStatus>(enabled ? "loading" : "ready");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((payload: unknown) => {
        if (cancelled) return;
        setData(pickList<T>(payload, key));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [url, key, nonce, enabled]);

  // Status flips back to "loading" from here (an event), never synchronously
  // inside the effect body — that would cascade renders.
  const reload = useCallback(() => {
    setStatus("loading");
    setNonce((value) => value + 1);
  }, []);

  return { data, status, reload };
}

export function useProjectsResource(enabled = true): Resource<ProjectSummary> {
  return useResource<ProjectSummary>("/api/projects?limit=24", "projects", enabled);
}

/** Convenience array-only view (kept for scenes that don't need status). */
export function useProjects(): ProjectSummary[] {
  return useProjectsResource().data;
}

export function useArticles(): ArticleSummary[] {
  return useArticlesResource().data;
}

export function useArticlesResource(): Resource<ArticleSummary> {
  return useResource<ArticleSummary>("/api/articles", "articles");
}

export function useServices(): Array<{
  slug: string;
  number?: string;
  title: string;
  short?: string;
  description?: string;
  deliverables?: Array<{ title: string; items: string[] }>;
}> {
  return useResource<{
    slug: string;
    number?: string;
    title: string;
    short?: string;
    description?: string;
    deliverables?: Array<{ title: string; items: string[] }>;
  }>("/api/services", "services").data;
}
