import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { trailSubmissions } from "@/lib/db/schema";
import { validateTrailSubmission } from "@/lib/contributions/submission";

/**
 * Submit a new-trail proposal (#146). Any signed-in member may submit; the
 * proposal is stored as `pending` against their account and reviewed by a
 * maintainer before any content is published. The route is a thin shell over
 * the pure `validateTrailSubmission` validator.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = validateTrailSubmission(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
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
    })
    .returning({ id: trailSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
