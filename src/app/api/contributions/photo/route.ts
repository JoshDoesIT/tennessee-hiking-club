import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { photoSubmissions } from "@/lib/db/schema";
import { getTrailBySlug } from "@/lib/trails";
import { validatePhotoSubmission, isAcceptableImage } from "@/lib/contributions/photo";

/**
 * Submit an in-app photo (#149) for an existing trail. Any signed-in member may
 * submit; the image is stored privately in Blob and the proposal recorded as
 * `pending` against their account, reviewed before a maintainer curates it into
 * the trail's `photos[]`.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = validatePhotoSubmission({
    trailSlug: form.get("trailSlug"),
    alt: form.get("alt"),
    credit: form.get("credit") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const { trailSlug, alt, credit } = parsed.data;

  const file = form.get("file");
  if (!(file instanceof Blob) || !isAcceptableImage(file.type, file.size)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  if (!getTrailBySlug(trailSlug)) {
    return NextResponse.json({ error: "Unknown trail" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo storage is not configured" },
      { status: 503 },
    );
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const key = crypto.randomUUID();
  const { url } = await put(`contributions/photos/${userId}/${key}.${ext}`, file, {
    access: "private",
    contentType: file.type,
  });

  const db = getDb();
  const [row] = await db
    .insert(photoSubmissions)
    .values({ userId, trailSlug, blobUrl: url, alt, credit: credit || null })
    .returning({ id: photoSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
