import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { createProject, listProjects } from "@/server/projects";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await listProjects({
      category: searchParams.get("category") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    });
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
    const project = await createProject(body);
    return NextResponse.json(
      { project },
      { status: 201, headers: { location: `/api/projects/${project.slug}` } },
    );
  } catch (error) {
    return apiError(error);
  }
}
