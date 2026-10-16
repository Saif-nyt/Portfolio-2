import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/server/auth";
import { apiAuthError, apiError } from "@/server/http";
import { listMedia, saveMedia } from "@/server/media";

export async function GET() {
  try {
    const items = await listMedia();
    return NextResponse.json({ items });
  } catch (error) {
    return apiError(error);
  }
}

/** multipart/form-data upload: field name "file". */
export async function POST(request: NextRequest) {
  const auth = authorizeAdmin(request);
  if (auth !== "ok") return apiAuthError(auth);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "invalid_multipart",
          message: "Request must be multipart/form-data with an image in field \"file\"",
        },
      },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "missing_file", message: 'Attach the image as form field "file"' } },
      { status: 400 },
    );
  }

  try {
    const media = await saveMedia(file);
    return NextResponse.json(
      { media },
      { status: 201, headers: { location: media.url } },
    );
  } catch (error) {
    return apiError(error);
  }
}
