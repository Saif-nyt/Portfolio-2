import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import type { Article } from "@/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const nonEmpty = (max: number) => z.string().min(1).max(max);

export const articleCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  title: nonEmpty(180),
  summary: nonEmpty(500),
  category: nonEmpty(60),
  publishedAt: z.string().regex(DATE_PATTERN, "publishedAt must be formatted as YYYY-MM-DD"),
  readingTime: nonEmpty(40),
  author: nonEmpty(100),
  cover: z.string().min(1).max(500).nullable().default(null),
  sections: z
    .array(
      z.object({
        heading: nonEmpty(160),
        paragraphs: z.array(z.string().min(1).max(3000)).min(1).max(12),
        list: z.array(z.string().min(1).max(500)).max(20).optional(),
      }),
    )
    .min(1)
    .max(40),
  related: z.array(z.string().regex(SLUG_PATTERN)).max(6).default([]),
});

export const articlePatchSchema = articleCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export interface ArticleListQuery {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ArticleListResult {
  items: Article[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted article failed validation",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function readArticles(): Promise<Article[]> {
  return readCollection<Article[]>("articles");
}

function writeArticles(articles: Article[]): Promise<void> {
  return writeCollection("articles", articles);
}

export async function getAllArticles(): Promise<Article[]> {
  return readArticles();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await readArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}

export async function getArticleCategories(): Promise<string[]> {
  const articles = await readArticles();
  return [...new Set(articles.map((article) => article.category))].sort();
}

export async function listArticles(query: ArticleListQuery = {}): Promise<ArticleListResult> {
  const articles = await readArticles();

  let filtered = articles;
  if (query.category && query.category !== "all") {
    const needle = query.category.toLowerCase();
    filtered = filtered.filter((article) => article.category.toLowerCase() === needle);
  }
  if (query.search && query.search.trim()) {
    const needle = query.search.trim().toLowerCase();
    filtered = filtered.filter(
      (article) =>
        article.title.toLowerCase().includes(needle) ||
        article.summary.toLowerCase().includes(needle) ||
        article.category.toLowerCase().includes(needle),
    );
  }

  const page = Math.max(1, Math.trunc(query.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Math.trunc(query.limit ?? 20) || 20));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

export async function createArticle(input: unknown): Promise<Article> {
  const parsed = articleCreateSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const data = parsed.data;
  const articles = await readArticles();
  const slug = data.slug ?? slugify(data.title);
  if (!slug) {
    throw new ApiError(422, "validation_failed", "Could not derive a slug from the title");
  }
  if (articles.some((article) => article.slug === slug)) {
    throw new ApiError(409, "slug_exists", `An article with slug "${slug}" already exists`);
  }

  const article: Article = { ...data, slug };
  await writeArticles([...articles, article]);
  return article;
}

export async function updateArticle(slug: string, input: unknown): Promise<Article> {
  const parsed = articlePatchSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const { slug: slugUpdate, ...changes } = parsed.data;
  if (slugUpdate !== undefined && slugUpdate !== slug) {
    throw new ApiError(400, "slug_immutable", "Slug cannot be changed after creation");
  }

  const articles = await readArticles();
  const current = articles.find((article) => article.slug === slug);
  if (!current) throw new ApiError(404, "not_found", `No article with slug "${slug}"`);

  const next: Article = { ...current, ...changes, slug };
  await writeArticles(articles.map((article) => (article.slug === slug ? next : article)));
  return next;
}

export async function removeArticle(slug: string): Promise<void> {
  const articles = await readArticles();
  if (!articles.some((article) => article.slug === slug)) {
    throw new ApiError(404, "not_found", `No article with slug "${slug}"`);
  }
  await writeArticles(articles.filter((article) => article.slug !== slug));
}
