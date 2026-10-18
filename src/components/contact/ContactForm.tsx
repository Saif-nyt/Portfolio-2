"use client";

import { ChevronDown, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { submitInquiry } from "@/app/contact/actions";
import type { ContactFormState } from "@/lib/contact";
import { SITE } from "@/lib/site";

const initialState: ContactFormState = { status: "idle", message: "" };

const serviceOptions = [
  "Full-Stack Web Development",
  "WordPress Development",
  "Shopify Development",
  "Meta Ads Marketing",
  "Server-Side Tracking & Conversion API",
  "E-commerce Growth Solutions",
  "Something else",
];

/** Maps ?service=<slug> query params (from service cards) to option labels. */
const serviceLabelBySlug: Record<string, string> = {
  "full-stack-web-development": "Full-Stack Web Development",
  "wordpress-development": "WordPress Development",
  "shopify-development": "Shopify Development",
  "meta-ads-marketing": "Meta Ads Marketing",
  "server-side-tracking": "Server-Side Tracking & Conversion API",
  "ecommerce-growth-solutions": "E-commerce Growth Solutions",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Every slugified option label, so any `?service=` spelling can preset. */
const serviceBySlug: Record<string, string> = Object.fromEntries(
  serviceOptions.map((option) => [slugify(option), option]),
);

const budgetOptions = ["Not sure yet", "Under $500", "$500 – $1,500", "$1,500 – $5,000", "$5,000+"];

const timelineOptions = ["Flexible", "ASAP", "Within 2 weeks", "Within a month", "1–3 months"];

const controlClass =
  "w-full rounded-xl border border-line bg-[color-mix(in_srgb,var(--panel-solid)_70%,transparent)] px-4 py-3 text-ink placeholder:text-faint transition-colors focus:border-accent";

const labelClass = "block font-display text-sm font-medium text-ink";

const errorClass = "text-sm font-medium text-[color-mix(in_srgb,#ff6b6b_70%,var(--ink))]";

function describe(id: string, error?: string, required?: boolean) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    "aria-required": required ? true : undefined,
  };
}

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-accent">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="sr-only"> (optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className={errorClass}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  options: string[];
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

function SelectField({
  id,
  label,
  options,
  defaultValue,
  placeholder,
  required,
  error,
  hint,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          name={id}
          defaultValue={defaultValue}
          className={`${controlClass} appearance-none pr-11`}
          {...describe(id, error, required)}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}

interface ContactFormPanelProps {
  autoFocus: boolean;
  onSendAnother: () => void;
  presetService?: string;
}

function ContactFormPanel({ autoFocus, onSendAnother, presetService }: ContactFormPanelProps) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const startedAtRef = useRef<HTMLInputElement>(null);

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};
  const showStatus = state.status === "error" || state.status === "unconfigured";
  const showSuccess = state.status === "success";
  const showFallback =
    state.status === "unconfigured" || (state.status === "error" && !state.fieldErrors);

  useEffect(() => {
    if (startedAtRef.current) {
      startedAtRef.current.value = String(Date.now());
    }
  }, []);

  useEffect(() => {
    if (autoFocus) {
      document.getElementById("contact-form-heading")?.focus();
      return;
    }
    const firstError = state.fieldErrors ? Object.keys(state.fieldErrors)[0] : undefined;
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    if (showSuccess || showStatus) {
      document.getElementById("contact-form-status")?.focus();
    }
  }, [state, autoFocus, showStatus, showSuccess]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Project inquiry</p>
        <h2 id="contact-form-heading" tabIndex={-1} className="text-2xl leading-[1.1] sm:text-3xl">
          Send a Message
        </h2>
        <p className="text-sm leading-relaxed text-dim sm:text-base">
          A few details about the project are enough — scope, timing and honest next steps come
          back in the reply.
        </p>
      </div>

      {showStatus ? (
        <div
          id="contact-form-status"
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
          className={`rounded-2xl border px-4 py-4 ${
            state.status === "unconfigured"
              ? "border-linestrong bg-accentsoft"
              : "border-line bg-[color-mix(in_srgb,var(--panel-solid)_60%,transparent)]"
          }`}
        >
          <p className="text-sm leading-relaxed text-ink">{state.message}</p>
          {showFallback ? (
            <div className="mt-3 flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
              <a
                href={`mailto:${SITE.email}`}
                className="text-accent underline underline-offset-4"
              >
                {SITE.email}
              </a>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-4"
              >
                Chat on WhatsApp (opens in a new tab)
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {showSuccess ? (
        <div
          id="contact-form-status"
          role="status"
          tabIndex={-1}
          className="flex flex-col items-start gap-5 rounded-2xl border border-linestrong bg-accentsoft px-5 py-6 sm:px-6"
        >
          <p className="eyebrow">Message sent</p>
          <p className="text-base leading-relaxed text-ink sm:text-lg">{state.message}</p>
          <button type="button" className="btn-ghost" onClick={onSendAnother}>
            Send another message
          </button>
        </div>
      ) : (
        <form action={formAction} noValidate className="flex flex-col gap-5">
          <FieldShell id="name" label="Name" required error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              defaultValue={values.name ?? ""}
              className={controlClass}
              {...describe("name", errors.name, true)}
            />
          </FieldShell>

          <FieldShell id="email" label="Email" required error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={200}
              defaultValue={values.email ?? ""}
              className={controlClass}
              {...describe("email", errors.email, true)}
            />
          </FieldShell>

          <FieldShell
            id="company"
            label="Company or website"
            hint="Optional — a link helps me understand the business before replying."
            error={errors.company}
          >
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              maxLength={200}
              defaultValue={values.company ?? ""}
              className={controlClass}
              {...describe("company", errors.company)}
            />
          </FieldShell>

          <SelectField
            id="service"
            label="Service required"
            required
            options={serviceOptions}
            placeholder="Select a service"
            defaultValue={values.service ?? presetService ?? ""}
            error={errors.service}
          />

          <SelectField
            id="budget"
            label="Budget"
            options={budgetOptions}
            defaultValue={values.budget || budgetOptions[0]}
            error={errors.budget}
            hint="Optional — an estimate is enough to keep the conversation realistic."
          />

          <SelectField
            id="timeline"
            label="Timeline"
            options={timelineOptions}
            defaultValue={values.timeline || timelineOptions[0]}
            error={errors.timeline}
          />

          <FieldShell
            id="description"
            label="Project description"
            required
            error={errors.description}
            hint="What are you building, improving or growing? Links and context help."
          >
            <textarea
              id="description"
              name="description"
              rows={6}
              maxLength={5000}
              defaultValue={values.description ?? ""}
              className={`${controlClass} min-h-36 resize-y`}
              {...describe("description", errors.description, true)}
            />
          </FieldShell>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="company_website">
              Company website
              <input
                id="company_website"
                name="company_website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </label>
          </div>

          <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />

          <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="btn-primary disabled:cursor-wait disabled:opacity-75"
            >
              {pending ? null : <Send className="h-4 w-4" aria-hidden="true" />}
              <span>{pending ? "Sending…" : "Send message"}</span>
            </button>
            <p className="text-xs leading-relaxed text-faint">
              Fields marked with * are required.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const presetSlug = searchParams.get("service");
  const presetService = presetSlug
    ? (serviceLabelBySlug[presetSlug] ?? serviceBySlug[slugify(presetSlug)])
    : undefined;
  const [generation, setGeneration] = useState(0);

  return (
    <ContactFormPanel
      key={generation}
      autoFocus={generation > 0}
      presetService={presetService}
      onSendAnother={() => setGeneration((current) => current + 1)}
    />
  );
}
