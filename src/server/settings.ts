import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import type { Settings } from "@/types";

export const settingsSchema = z.object({
  avatar: z
    .string()
    .max(500)
    .nullable()
    .refine(
      (value) =>
        value === null || value.startsWith("/media/") || /^https?:\/\//.test(value),
      { message: "avatar must be a /media/ path or an absolute http(s) URL" },
    ),
  aboutCapabilities: z.array(z.string().min(1).max(80)).min(1).max(12),
});

export const settingsPatchSchema = settingsSchema.partial();

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted settings failed validation",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  );
}

export async function getSettings(): Promise<Settings> {
  return readCollection<Settings>("settings");
}

export async function updateSettings(input: unknown): Promise<Settings> {
  const parsed = settingsPatchSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    throw new ApiError(400, "empty_update", "Provide at least one setting to update");
  }

  const current = await getSettings();
  const next: Settings = { ...current, ...parsed.data };
  await writeCollection("settings", next);
  return next;
}
