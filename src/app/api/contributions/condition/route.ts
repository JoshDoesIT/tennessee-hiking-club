import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { conditionSubmissions } from "@/lib/db/schema";
import { getTrailBySlug } from "@/lib/trails";
import { validateConditionSubmission } from "@/lib/contributions/condition";

/**
 * Submit an in-app condition report (#149) for an existing trail. Any signed-in
 * member may submit; the report is stored as a `pending` proposal against their
 * account and reviewed before a maintainer curates it into the trail content.
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
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = validateConditionSubmission(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { trailSlug, status, note } = parsed.data;
  if (!getTrailBySlug(trailSlug)) {
    return NextResponse.json({ error: "Unknown trail" }, { status: 404 });
  }

  const reportDate = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const [row] = await db
    .insert(conditionSubmissions)
    .values({ userId, trailSlug, status, note: note || null, reportDate })
    .returning({ id: conditionSubmissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
