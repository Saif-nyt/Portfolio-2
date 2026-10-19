"use server";

import {
  checkRateLimit,
  collectValues,
  getClientIp,
  isCompletedTooFast,
  isHoneypotFilled,
  readField,
  recordRateLimit,
  validateInquiry,
} from "@/lib/contact";
import type { ContactFormState, ContactValues } from "@/lib/contact";
import { isEmailConfigured, sendContactEmail } from "@/lib/email";
import { SITE } from "@/lib/site";
import { isMongoConfigured, storeContactInquiry } from "@/server/mongodb";

const MESSAGES = {
  honeypot: "Thanks — your message has been received.",
  tooFast:
    "That went through a little quickly. Please take a moment to review the details and send the message again.",
  validation: "Please review the highlighted fields and send the message again.",
  unconfigured: `This form is not connected to its message database yet, so nothing was saved. Please email ${SITE.email} directly or use WhatsApp instead.`,
  saveFailure: `Your message could not be saved just now. Please email ${SITE.email} directly and I will get back to you as soon as possible.`,
  savedWithoutEmail:
    "Thank you — your message has been received and saved. I will review it and get back to you as soon as possible.",
  savedEmailFailure:
    "Your message has been received and saved, but the email notification could not be sent. I will review it and get back to you as soon as possible.",
  success:
    "Thank you — your message has been received. I will review it and get back to you as soon as possible.",
};

function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const unit = minutes === 1 ? "minute" : "minutes";
  return `A few messages have already been sent from this device. Please wait about ${minutes} ${unit} before trying again, or email ${SITE.email} directly.`;
}

function buildEmail(values: ContactValues): { subject: string; text: string } {
  const subject = `New project inquiry from ${values.name}`;
  const text = [
    "New contact form submission from the portfolio website.",
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Company or website: ${values.company || "Not provided"}`,
    `Service required: ${values.service}`,
    `Budget: ${values.budget || "Not provided"}`,
    `Timeline: ${values.timeline || "Not provided"}`,
    "",
    "Project description:",
    values.description,
  ].join("\n");
  return { subject, text };
}

export async function submitInquiry(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  if (isHoneypotFilled(formData)) {
    return { status: "success", message: MESSAGES.honeypot };
  }

  const startedAt = readField(formData, "startedAt");

  if (isCompletedTooFast(startedAt)) {
    const values = collectValues(formData);
    return { status: "error", message: MESSAGES.tooFast, values: { ...values } };
  }

  const validation = validateInquiry(formData);

  if (!validation.ok) {
    return {
      status: "error",
      message: MESSAGES.validation,
      fieldErrors: { ...validation.fieldErrors },
      values: { ...validation.values },
    };
  }

  const values = validation.values;
  if (!isMongoConfigured()) {
    return { status: "unconfigured", message: MESSAGES.unconfigured, values: { ...values } };
  }

  const ip = await getClientIp();
  const keys = [`ip:${ip}`, `email:${values.email.toLowerCase()}`];
  const verdict = checkRateLimit(keys);

  if (!verdict.allowed) {
    return {
      status: "error",
      message: rateLimitMessage(verdict.retryAfterSeconds),
      values: { ...values },
    };
  }

  recordRateLimit(keys);

  try {
    await storeContactInquiry(values);
  } catch (error) {
    console.error("contact form submission could not be saved", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "error", message: MESSAGES.saveFailure, values: { ...values } };
  }

  if (!isEmailConfigured()) {
    return { status: "success", message: MESSAGES.savedWithoutEmail };
  }

  const email = buildEmail(values);
  const result = await sendContactEmail({
    subject: email.subject,
    text: email.text,
    replyTo: values.email,
  });

  if (!result.configured) {
    return { status: "success", message: MESSAGES.savedWithoutEmail };
  }

  if (!result.ok) {
    return { status: "success", message: MESSAGES.savedEmailFailure };
  }

  return { status: "success", message: MESSAGES.success };
}
