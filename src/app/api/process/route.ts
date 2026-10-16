import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { getProcessSteps, replaceProcessSteps } from "@/server/process";

export async function GET() {
  try {
    const steps = await getProcessSteps();
    return NextResponse.json({ steps }, { headers: listCacheHeaders });
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
    // Accepts either a raw array of steps or { steps: [...] }.
    const payload = Array.isArray(body) ? body : (body as { steps?: unknown })?.steps;
    const steps = await replaceProcessSteps(payload);
    return NextResponse.json({ steps });
  } catch (error) {
    return apiError(error);
  }
}
