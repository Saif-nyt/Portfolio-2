import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Meta Conversions API dry-run endpoint, gated by META_TEST_MODE=1.
 * It validates an event payload the way a CAPI integration would and echoes
 * the exact request body that would be forwarded to Meta — it never contacts
 * Meta and requires no tokens, so it is safe to expose in any environment
 * while the flag is unset elsewhere (requests then answer 404).
 */

const eventSchema = z.object({
  event_name: z.enum(["PageView", "Lead", "Contact", "ViewContent", "Purchase"]),
  event_id: z.string().min(8).max(128),
  event_source_url: z.url().max(2000),
  action_source: z.enum(["website"]).default("website"),
  user_client_ip_address: z.ipv4().or(z.ipv6()).optional(),
  user_client_user_agent: z.string().max(500).optional(),
  custom_data: z
    .object({
      content_name: z.string().max(200).optional(),
      content_category: z.string().max(200).optional(),
      value: z.number().nonnegative().optional(),
      currency: z.string().length(3).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  if (process.env.META_TEST_MODE !== "1") {
    return NextResponse.json({ error: { code: "not_found", message: "Not found" } }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_event",
          message: "Payload failed CAPI event validation",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 422 },
    );
  }

  const event = parsed.data;
  const pixelId = process.env.META_PIXEL_ID ?? "YOUR_PIXEL_ID";

  return NextResponse.json({
    mode: "test",
    dry_run: true,
    note: "Validated only — nothing was sent to Meta. Set META_PIXEL_ID to customise the echoed pixel id.",
    would_send: {
      endpoint: `https://graph.facebook.com/v21.0/${pixelId}/events`,
      access_token: "<META_CAPI_ACCESS_TOKEN — never echoed>",
      data: [
        {
          event_name: event.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.event_id,
          event_source_url: event.event_source_url,
          action_source: event.action_source,
          user_data: {
            client_ip_address: event.user_client_ip_address,
            client_user_agent: event.user_client_user_agent,
          },
          custom_data: event.custom_data ?? {},
        },
      ],
    },
  });
}
