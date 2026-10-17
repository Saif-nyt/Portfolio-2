import { NextRequest, NextResponse } from "next/server";

/**
 * Sample-catalog proxy in front of DummyJSON (a free public test API).
 * It exists to demonstrate fetch → cache → error handling without shipping
 * fake inventory as real work: every payload is tagged source: "dummyjson".
 */

const UPSTREAM = "https://dummyjson.com/products";
const TTL_MS = 60_000;
const MAX_LIMIT = 20;

let cache: { at: number; body: unknown } | null = null;

function upstreamError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : 6, 1), MAX_LIMIT);

  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return NextResponse.json(cache.body, {
      headers: { "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" },
    });
  }

  try {
    const upstream = await fetch(
      `${UPSTREAM}?limit=${limit}&select=title,price,thumbnail,stock,brand,category`,
      { headers: { accept: "application/json" } },
    );

    if (!upstream.ok) {
      return upstreamError(
        502,
        "upstream_error",
        "The sample catalog upstream answered with an error. Try again shortly.",
      );
    }

    const data = (await upstream.json()) as { products?: unknown[] };
    const body = {
      source: "dummyjson",
      sample: true,
      note: "Sample catalog data for demonstration only — not real inventory.",
      products: data.products ?? [],
    };
    cache = { at: now, body };

    return NextResponse.json(body, {
      headers: { "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return upstreamError(
      502,
      "upstream_unreachable",
      "The sample catalog could not be reached. Check the connection and try again.",
    );
  }
}
