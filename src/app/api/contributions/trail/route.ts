import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { trailSubmissions } from "@/lib/db/schema";
import { validateTrailSubmission } from "@/lib/contributions/submission";
import { isAcceptableImage } from "@/lib/contributions/photo";

/** A contributor can attach a few photos to a new-trail proposal (#29). */
const MAX_PHOTOS = 5;

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}
function numField(form: FormData, name: string): number | undefined {
  const value = field(form, name);
  return value === "" ? undefined : Number(value);
}

/**
 * Submit a new-trail proposal (#146) with optional photos (#29). Any signed-in
 * member may submit; the proposal is stored as `pending` against their account
 * and reviewed by a maintainer before any content is published. Photos are kept
 * privately in Blob and previewed in the admin queue via the view route.
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
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = validateTrailSubmission({
    name: field(form, "name"),
    region: field(form, "region"),
    area: field(form, "area"),
    lat: numField(form, "lat"),
    lng: numField(form, "lng"),
    description: field(form, "description"),
    lengthMiles: numField(form, "lengthMiles"),
    elevationGainFt: numField(form, "elevationGainFt"),
    difficulty: field(form, "difficulty") || undefined,
    routeType: field(form, "routeType") || undefined,
    links: field(form, "links") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid submission",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Optional photos: at most MAX_PHOTOS, each a real image.
  const files = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);
  if (files.some((f) => !isAcceptableImage(f.type, f.size))) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  if (files.length > 0 && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo storage is not configured" },
      { status: 503 },
    );
  }

  const photoUrls: string[] = [];
  for (const file of files) {
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const { url } = await put(
      `contributions/trail-photos/${userId}/${crypto.randomUUID()}.${ext}`,
      file,
      { access: "private", contentType: file.type },
    );
    photoUrls.push(url);
  }

  const s = parsed.data;
  const db = getDb();
  const [row] = await db
    .insert(trailSubmissions)
    .values({
      userId,
      name: s.name,
      region: s.region,
      area: s.area,
      lat: s.lat,
      lng: s.lng,
      lengthMiles: s.lengthMiles ?? null,
      elevationGainFt: s.elevationGainFt ?? null,
      difficulty: s.difficulty ?? null,
      routeType: s.routeType ?? null,
      description: s.description,
      links: s.links?.trim() || null,
      photoUrls: photoUrls.length ? photoUrls : null,
    })
    .returning({ id: trailSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
