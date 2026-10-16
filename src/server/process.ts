import { z } from "zod";
import { ApiError } from "@/server/api-error";
import { readCollection, writeCollection } from "@/server/store";
import type { ProcessStep } from "@/types";

export const processStepsSchema = z
  .array(
    z.object({
      number: z.string().regex(/^\d{2}$/, "Number must be two digits, e.g. 01"),
      title: z.string().min(1).max(80),
      body: z.string().min(1).max(500),
    }),
  )
  .min(1)
  .max(12);

function toApiError(error: z.ZodError): ApiError {
  return new ApiError(
    422,
    "validation_failed",
    "The submitted process steps failed validation",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  );
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  return readCollection<ProcessStep[]>("process");
}

/** Whole-collection replace (PUT /api/process) — ordered methodology steps. */
export async function replaceProcessSteps(input: unknown): Promise<ProcessStep[]> {
  const parsed = processStepsSchema.safeParse(input);
  if (!parsed.success) throw toApiError(parsed.error);

  const steps = parsed.data;
  const numbers = new Set(steps.map((step) => step.number));
  if (numbers.size !== steps.length) {
    throw new ApiError(409, "duplicate_number", "Process step numbers must be unique");
  }

  await writeCollection("process", steps);
  return steps;
}
