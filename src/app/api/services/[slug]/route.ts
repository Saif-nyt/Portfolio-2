import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/server/api-error";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError, invalidJsonError } from "@/server/http";
import { getServiceBySlug, removeService, updateService } from "@/server/services";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);
    if (!service) {
      throw new ApiError(404, "not_found", `No service with slug "${slug}"`);
    }
    return NextResponse.json({ service });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonError();
  }

  try {
    const { slug } = await params;
    const service = await updateService(slug, body);
    return NextResponse.json({ service });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  try {
    const { slug } = await params;
    await removeService(slug);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
