import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import type { SkillGroup } from "@/types";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const skillGroupsSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(80).regex(ID_PATTERN, "id must be a lowercase slug"),
      title: z.string().min(1).max(80),
      blurb: z.string().min(1).max(400),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      items: z
        .array(
          z.object({
            name: z.string().min(1).max(80),
            note: z.string().min(1).max(160).optional(),
          }),
        )
        .min(1)
        .max(20),
    }),
  )
  .min(1)
  .max(8);

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted skill groups failed validation",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  );
}

export async function getSkillGroups(): Promise<SkillGroup[]> {
  return readCollection<SkillGroup[]>("skills");
}

/** Whole-collection replace (PUT /api/skills) — groups are one cohesive map. */
export async function replaceSkillGroups(input: unknown): Promise<SkillGroup[]> {
  const parsed = skillGroupsSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const groups = parsed.data;
  const ids = new Set(groups.map((group) => group.id));
  if (ids.size !== groups.length) {
    throw new ApiError(409, "duplicate_id", "Skill group ids must be unique");
  }

  await writeCollection("skills", groups);
  return groups;
}
