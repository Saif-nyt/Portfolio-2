import { SITE } from "@/lib/site";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Portfolio Website <onboarding@resend.dev>";

export interface ContactEmailPayload {
  subject: string;
  text: string;
  replyTo?: string;
}

export type ContactEmailResult =
  | { configured: false }
  | { configured: true; ok: true; id: string }
  | { configured: true; ok: false; error: string };

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function isEmailConfigured(): boolean {
  return readEnv("RESEND_API_KEY").length > 0;
}

export interface ContactEmailConfig {
  apiKey: string;
  to: string;
  from: string;
  replyTo: string;
}

export function getContactEmailConfig(): ContactEmailConfig {
  return {
    apiKey: readEnv("RESEND_API_KEY"),
    to: readEnv("CONTACT_TO_EMAIL") || SITE.email,
    from: readEnv("CONTACT_FROM_EMAIL") || DEFAULT_FROM,
    replyTo: readEnv("CONTACT_REPLY_TO"),
  };
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<ContactEmailResult> {
  const config = getContactEmailConfig();

  if (!config.apiKey) {
    return { configured: false };
  }

  const replyTo = payload.replyTo || config.replyTo;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: payload.subject,
        text: payload.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      console.error("contact form provider rejected the message", {
        status: response.status,
        detail,
      });
      return { configured: true, ok: false, error: `Provider returned ${response.status}` };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { configured: true, ok: true, id: typeof data.id === "string" ? data.id : "" };
  } catch (error) {
    console.error(
      "contact form could not reach the email provider",
      error instanceof Error ? error.message : "unknown error",
    );
    return { configured: true, ok: false, error: "Request failed" };
  }
}
