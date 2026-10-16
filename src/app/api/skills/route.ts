import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { getSkillGroups, replaceSkillGroups } from "@/server/skills";

export async function GET() {
  try {
    const groups = await getSkillGroups();
    return NextResponse.json({ groups }, { headers: listCacheHeaders });
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
    // Accepts either a raw array of groups or { groups: [...] }.
    const payload = Array.isArray(body)
      ? body
      : (body as { groups?: unknown })?.groups;
    const groups = await replaceSkillGroups(payload);
    return NextResponse.json({ groups });
  } catch (error) {
    return apiError(error);
  }
}
