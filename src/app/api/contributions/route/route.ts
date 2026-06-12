import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { routeSubmissions } from "@/lib/db/schema";
import { getTrailBySlug } from "@/lib/trails";
import { prepareRouteSubmission } from "@/lib/contributions/route";

/** A recorded GPX track rarely exceeds a megabyte; cap well above that. */
const MAX_GPX_BYTES = 8 * 1024 * 1024;

/**
 * Contribute a recorded hike as a trail's route (#201): a signed-in member
 * uploads the GPX from a hike, which is parsed, downsampled, and stored as a
 * pending submission for the admin review queue. On approval a maintainer
 * curates the points into the trail's `route` front-matter (never
 * auto-published). Mirrors the waypoint contribution route: multipart form,
 * gated on sign-in, validated before it touches the database.
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

  const trailSlug = String(form.get("trailSlug") ?? "").trim();
  if (!getTrailBySlug(trailSlug)) {
    return NextResponse.json({ error: "Unknown trail" }, { status: 404 });
  }

  const file = form.get("gpx");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Attach a GPX file" }, { status: 400 });
  }
  if (file.size > MAX_GPX_BYTES) {
    return NextResponse.json(
      { error: "GPX file is too large" },
      { status: 400 },
    );
  }

  const prepared = prepareRouteSubmission(await file.text());
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(routeSubmissions)
    .values({
      userId,
      trailSlug,
      name: prepared.name,
      route: JSON.stringify(prepared.route),
      pointCount: prepared.pointCount,
      lengthMiles: prepared.lengthMiles,
      gainFt: prepared.gainFt,
    })
    .returning({ id: routeSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
