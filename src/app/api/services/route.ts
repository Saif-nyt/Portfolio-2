import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { createService, listServices } from "@/server/services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await listServices(
      Number(searchParams.get("page") ?? "1"),
      Number(searchParams.get("limit") ?? "50"),
    );
    return NextResponse.json(result, { headers: listCacheHeaders });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonError();
  }

  try {
    const service = await createService(body);
    return NextResponse.json(
      { service },
      { status: 201, headers: { location: `/api/services/${service.slug}` } },
    );
  } catch (error) {
    return apiError(error);
  }
}
