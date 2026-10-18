"use client";

import { useEffect, useState } from "react";

export interface ProjectSummary {
  slug: string;
  index?: string;
  title: string;
  category: string;
  categoryLabel?: string;
  stack?: string[];
  summary: string;
  kind?: string;
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
 */
export function useProjects(): ProjectSummary[] {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load projects"))))
      .then((data: { projects?: ProjectSummary[] } | ProjectSummary[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.projects ?? []);
        setProjects(list);
      })
      .catch(() => {
        // Silent — the conventional fallback content below the scene still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return projects;
}

export function useArticles(): ArticleSummary[] {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load articles"))))
      .then((data: { articles?: ArticleSummary[] } | ArticleSummary[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.articles ?? []);
        setArticles(list);
      })
      .catch(() => {
        // Silent fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return articles;
}

export function useServices(): Array<{
  slug: string;
  number?: string;
  title: string;
  short?: string;
  description?: string;
  deliverables?: Array<{ title: string; items: string[] }>;
}> {
  const [services, setServices] = useState<
    Array<{
      slug: string;
      number?: string;
      title: string;
      short?: string;
      description?: string;
      deliverables?: Array<{ title: string; items: string[] }>;
    }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load services"))))
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : ((data as { services?: typeof services })?.services ?? []);
        setServices(list);
      })
      .catch(() => {
        // Silent fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return services;
}
