import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { waypointSubmissions } from "@/lib/db/schema";
import { getTrailBySlug } from "@/lib/trails";
import { validateWaypointSubmission } from "@/lib/contributions/waypoint";
import { isAcceptableImage } from "@/lib/contributions/photo";

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}
function numField(form: FormData, name: string): number | undefined {
  const value = field(form, name);
  return value === "" ? undefined : Number(value);
}

/**
 * Suggest a landmark/waypoint (#191) on an existing trail: a signed-in member
 * proposes a coordinate + name + type (+ optional description and photo). Stored
 * as a pending submission for the admin review queue and curated into the
 * trail's `waypoints[]` on approval (never auto-published). Mirrors the photo
 * contribution route: multipart form, optional photo uploaded privately to Blob.
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

  const parsed = validateWaypointSubmission({
    trailSlug: field(form, "trailSlug"),
    lat: numField(form, "lat"),
    lng: numField(form, "lng"),
    name: field(form, "name"),
    type: field(form, "type"),
    description: field(form, "description") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid suggestion", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { trailSlug, lat, lng, name, type, description } = parsed.data;

  if (!getTrailBySlug(trailSlug)) {
    return NextResponse.json({ error: "Unknown trail" }, { status: 404 });
  }

  // The photo is optional; only validate/upload one when attached.
  const file = form.get("photo");
  let photoUrl: string | null = null;
  if (file instanceof Blob && file.size > 0) {
    if (!isAcceptableImage(file.type, file.size)) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Photo storage is not configured" },
        { status: 503 },
      );
    }
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const { url } = await put(
      `contributions/waypoints/${userId}/${crypto.randomUUID()}.${ext}`,
      file,
      { access: "private", contentType: file.type },
    );
    photoUrl = url;
  }

  const db = getDb();
  const [row] = await db
    .insert(waypointSubmissions)
    .values({
      userId,
      trailSlug,
      lat,
      lng,
      name,
      type,
      description: description?.trim() || null,
      photoUrl,
    })
    .returning({ id: waypointSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
