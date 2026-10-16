import { headers } from "next/headers";

export type ContactStatus = "idle" | "error" | "success" | "unconfigured";

export interface ContactFormState {
  status: ContactStatus;
  message: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export type ContactValues = {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  timeline: string;
  description: string;
};

export interface ContactValidation {
  ok: boolean;
  values: ContactValues;
  fieldErrors: Record<string, string>;
}

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

const MIN_COMPLETION_MS = 3000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_MAX_KEYS = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NAME_MAX = 120;
const EMAIL_MAX = 200;
const COMPANY_MAX = 200;
const SERVICE_MAX = 160;
const OPTION_MAX = 60;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 5000;

const attempts = new Map<string, number[]>();

export function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}

export function sanitizeLine(value: string, maxLength: number): string {
  return stripControlCharacters(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeParagraph(value: string, maxLength: number): string {
  return stripControlCharacters(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function collectValues(formData: FormData): ContactValues {
  return {
    name: sanitizeLine(readField(formData, "name"), NAME_MAX),
    email: sanitizeLine(readField(formData, "email"), EMAIL_MAX),
    company: sanitizeLine(readField(formData, "company"), COMPANY_MAX),
    service: sanitizeLine(readField(formData, "service"), SERVICE_MAX),
    budget: sanitizeLine(readField(formData, "budget"), OPTION_MAX),
    timeline: sanitizeLine(readField(formData, "timeline"), OPTION_MAX),
    description: sanitizeParagraph(readField(formData, "description"), DESCRIPTION_MAX),
  };
}

export function validateValues(values: ContactValues): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (values.name.length < 2) {
    fieldErrors.name = "Please enter your name using at least 2 characters.";
  }

  if (!values.email) {
    fieldErrors.email = "Please enter your email address so a reply can reach you.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    fieldErrors.email = "That email address does not look right — please check it for typos.";
  }

  if (!values.service) {
    fieldErrors.service = "Please choose the service you are looking for.";
  }

  if (values.description.length < DESCRIPTION_MIN) {
    fieldErrors.description = `Please describe the project in at least ${DESCRIPTION_MIN} characters so there is enough context to respond to.`;
  }

  return fieldErrors;
}

export function validateInquiry(formData: FormData): ContactValidation {
  const values = collectValues(formData);
  const fieldErrors = validateValues(values);
  return {
    ok: Object.keys(fieldErrors).length === 0,
    values,
    fieldErrors,
  };
}

export function isHoneypotFilled(formData: FormData): boolean {
  return sanitizeLine(readField(formData, "company_website"), COMPANY_MAX).length > 0;
}

export function isCompletedTooFast(startedAt: string): boolean {
  const parsed = Number.parseInt(startedAt, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return false;
  }
  const elapsed = Date.now() - parsed;
  if (elapsed < 0) {
    return parsed - Date.now() > FUTURE_TOLERANCE_MS;
  }
  return elapsed < MIN_COMPLETION_MS;
}

function activeAttempts(key: string, now: number): number[] {
  const times = (attempts.get(key) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  if (times.length === 0) {
    attempts.delete(key);
  } else {
    attempts.set(key, times);
  }
  return times;
}

export function checkRateLimit(keys: string[]): RateLimitVerdict {
  const now = Date.now();
  for (const key of keys) {
    const times = activeAttempts(key, now);
    if (times.length >= RATE_LIMIT_MAX) {
      const oldest = times[0];
      const waitMs = oldest + RATE_LIMIT_WINDOW_MS - now;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordRateLimit(keys: string[]): void {
  const now = Date.now();
  if (attempts.size > RATE_LIMIT_MAX_KEYS) {
    for (const key of Array.from(attempts.keys())) {
      activeAttempts(key, now);
    }
  }
  for (const key of keys) {
    const times = activeAttempts(key, now);
    times.push(now);
    attempts.set(key, times);
  }
}

export async function getClientIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0];
      const cleaned = first ? first.trim() : "";
      if (cleaned) {
        return cleaned;
      }
    }
    const realIp = requestHeaders.get("x-real-ip");
    const cleanedRealIp = realIp ? realIp.trim() : "";
    return cleanedRealIp || "unknown";
  } catch {
    return "unknown";
  }
}
