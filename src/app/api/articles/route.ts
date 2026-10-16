import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError, listCacheHeaders } from "@/server/http";
import { createArticle, listArticles } from "@/server/articles";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await listArticles({
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
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
    const article = await createArticle(body);
    return NextResponse.json(
      { article },
      { status: 201, headers: { location: `/api/articles/${article.slug}` } },
    );
  } catch (error) {
    return apiError(error);
  }
}
