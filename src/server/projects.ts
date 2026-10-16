import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import { PROJECT_CATEGORY_IDS, type Project } from "@/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INDEX_PATTERN = /^\d{2,3}$/;
const ACCENTS = ["cyan", "turquoise", "mist"] as const;

const nonEmpty = (max: number) => z.string().min(1).max(max);
const stringList = (max: number, maxItems: number) =>
  z.array(z.string().min(1).max(max)).min(1).max(maxItems);

export const projectCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  index: z
    .string()
    .regex(INDEX_PATTERN, "Index must be 2–3 digits, e.g. 07")
    .optional(),
  title: nonEmpty(140),
  category: z.enum(PROJECT_CATEGORY_IDS),
  alsoIn: z.array(z.enum(PROJECT_CATEGORY_IDS)).max(3).optional(),
  categoryLabel: nonEmpty(80),
  stack: stringList(80, 20),
  summary: nonEmpty(400),
  image: z.string().min(1).max(500).nullable().default(null),
  accent: z.enum(ACCENTS),
  overview: nonEmpty(2000),
  problem: nonEmpty(2000),
  audience: nonEmpty(500),
  role: nonEmpty(500),
  services: stringList(120, 15),
  tools: stringList(80, 20),
  designDecisions: stringList(400, 15),
  implementation: stringList(400, 15),
  sections: z
    .array(
      z.object({
        label: nonEmpty(80),
        body: z.array(z.string().min(1).max(500)).min(1).max(6),
      }),
    )
    .min(1)
    .max(15),
  deliverables: stringList(200, 15),
  results: z.string().min(1).max(1000).nullable().default(null),
  lessons: stringList(400, 10),
  related: z.array(z.string().regex(SLUG_PATTERN)).max(6).default([]),
});

export const projectPatchSchema = projectCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export type ProjectCreateInput = z.input<typeof projectCreateSchema>;

export interface ListQuery {
  category?: string;
  page?: number;
  limit?: number;
}

export interface ListResult {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted project failed validation",
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function assertUniqueSlug(projects: Project[], slug: string, exceptSlug?: string): void {
  const clash = projects.some(
    (project) => project.slug === slug && project.slug !== exceptSlug,
  );
  if (clash) {
    throw new ApiError(409, "slug_exists", `A project with slug "${slug}" already exists`);
  }
}

function readProjects(): Promise<Project[]> {
  return readCollection<Project[]>("projects");
}

function writeProjects(projects: Project[]): Promise<void> {
  return writeCollection("projects", projects);
}

export async function getAllProjects(): Promise<Project[]> {
  return readProjects();
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await readProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function listProjects(query: ListQuery = {}): Promise<ListResult> {
  const projects = await readProjects();

  const category = query.category && query.category !== "all" ? query.category : null;
  if (category && !(PROJECT_CATEGORY_IDS as readonly string[]).includes(category)) {
    throw new ApiError(400, "invalid_category", `Unknown category "${category}"`);
  }

  const filtered = category
    ? projects.filter(
        (project) =>
          project.category === category || project.alsoIn?.includes(category as Project["category"]),
      )
    : projects;

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

export async function createProject(input: unknown): Promise<Project> {
  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const data = parsed.data;
  const projects = await readProjects();
  const slug = data.slug ?? slugify(data.title);

  if (!slug) {
    throw new ApiError(422, "validation_failed", "Could not derive a slug from the title");
  }
  assertUniqueSlug(projects, slug);

  const project: Project = {
    ...data,
    slug,
    index: data.index ?? String(projects.length + 1).padStart(2, "0"),
  };

  await writeProjects([...projects, project]);
  return project;
}

export async function updateProject(slug: string, input: unknown): Promise<Project> {
  const parsed = projectPatchSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const { slug: slugUpdate, index: indexUpdate, ...changes } = parsed.data;
  if (slugUpdate !== undefined && slugUpdate !== slug) {
    throw new ApiError(400, "slug_immutable", "Slug cannot be changed after creation");
  }

  const projects = await readProjects();
  const current = projects.find((project) => project.slug === slug);
  if (!current) {
    throw new ApiError(404, "not_found", `No project with slug "${slug}"`);
  }

  const next: Project = {
    ...current,
    ...changes,
    slug,
    index: indexUpdate ?? current.index,
  };

  await writeProjects(projects.map((project) => (project.slug === slug ? next : project)));
  return next;
}

export async function removeProject(slug: string): Promise<void> {
  const projects = await readProjects();
  if (!projects.some((project) => project.slug === slug)) {
    throw new ApiError(404, "not_found", `No project with slug "${slug}"`);
  }
  await writeProjects(projects.filter((project) => project.slug !== slug));
}
