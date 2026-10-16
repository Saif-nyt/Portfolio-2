import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import type { Service } from "@/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACCENTS = ["cyan", "turquoise", "mist"] as const;

const nonEmpty = (max: number) => z.string().min(1).max(max);

export const serviceCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  number: z.string().regex(/^\d{2}$/, "Number must be two digits, e.g. 01"),
  title: nonEmpty(120),
  short: nonEmpty(220),
  description: nonEmpty(500),
  accent: z.enum(ACCENTS),
  deliverables: z
    .array(
      z.object({
        title: nonEmpty(80),
        items: z.array(z.string().min(1).max(200)).min(1).max(15),
      }),
    )
    .min(1)
    .max(8),
});

export const servicePatchSchema = serviceCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export interface ServiceListResult {
  items: Service[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted service failed validation",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
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

function readServices(): Promise<Service[]> {
  return readCollection<Service[]>("services");
}

function writeServices(services: Service[]): Promise<void> {
  return writeCollection("services", services);
}

export async function getAllServices(): Promise<Service[]> {
  return readServices();
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await readServices();
  return services.find((service) => service.slug === slug) ?? null;
}

export async function listServices(page = 1, limit = 50): Promise<ServiceListResult> {
  const services = await readServices();
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit) || 50));
  const total = services.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;

  return {
    items: services.slice(start, start + safeLimit),
    pagination: { page: safePage, limit: safeLimit, total, totalPages },
  };
}

export async function createService(input: unknown): Promise<Service> {
  const parsed = serviceCreateSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const data = parsed.data;
  const services = await readServices();
  const slug = data.slug ?? slugify(data.title);
  if (!slug) {
    throw new ApiError(422, "validation_failed", "Could not derive a slug from the title");
  }
  if (services.some((service) => service.slug === slug)) {
    throw new ApiError(409, "slug_exists", `A service with slug "${slug}" already exists`);
  }

  const service: Service = { ...data, slug };
  await writeServices([...services, service]);
  return service;
}

export async function updateService(slug: string, input: unknown): Promise<Service> {
  const parsed = servicePatchSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const { slug: slugUpdate, ...changes } = parsed.data;
  if (slugUpdate !== undefined && slugUpdate !== slug) {
    throw new ApiError(400, "slug_immutable", "Slug cannot be changed after creation");
  }

  const services = await readServices();
  const current = services.find((service) => service.slug === slug);
  if (!current) throw new ApiError(404, "not_found", `No service with slug "${slug}"`);

  const next: Service = { ...current, ...changes, slug };
  await writeServices(services.map((service) => (service.slug === slug ? next : service)));
  return next;
}

export async function removeService(slug: string): Promise<void> {
  const services = await readServices();
  if (!services.some((service) => service.slug === slug)) {
    throw new ApiError(404, "not_found", `No service with slug "${slug}"`);
  }
  await writeServices(services.filter((service) => service.slug !== slug));
}
