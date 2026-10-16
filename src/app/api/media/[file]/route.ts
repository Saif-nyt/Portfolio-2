import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError } from "@/server/http";
import { removeMedia } from "@/server/media";

type Context = { params: Promise<{ file: string }> };

export async function DELETE(request: NextRequest, { params }: Context) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  try {
    const { file } = await params;
    await removeMedia(decodeURIComponent(file));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
