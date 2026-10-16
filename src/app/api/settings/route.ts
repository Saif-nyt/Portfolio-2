import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { getSettings, updateSettings } from "@/server/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings }, { headers: listCacheHeaders });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonError();
  }

  try {
    const settings = await updateSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}
