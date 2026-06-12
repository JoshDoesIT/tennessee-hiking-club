import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { hikes } from "@/lib/db/schema";
import { planSync, rowToEntry, entryToInsert } from "@/lib/hikes/sync";

const routePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  elevationFt: z.number(),
});

const bodySchema = z.object({
  hikes: z.array(
    z.object({
      trailSlug: z.string().min(1),
      hikedOn: z.string().min(1),
      note: z.string().optional(),
      conditions: z.string().optional(),
      photoUrl: z.string().optional(),
      track: z
        .object({
          points: z.array(routePointSchema),
          durationMin: z.number().optional(),
        })
        .optional(),
    }),
  ),
});

/**
 * Sync the local hike log with the signed-in account: add any local hikes the
 * account is missing, then return the merged log for the client to adopt.
 * Additive only, so nothing is ever deleted.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let local;
  try {
    local = bodySchema.parse(await req.json()).hikes;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select().from(hikes).where(eq(hikes.userId, userId));
  const { toInsert, toUpdate, merged } = planSync(local, rows.map(rowToEntry));

  if (toInsert.length > 0) {
    await db.insert(hikes).values(toInsert.map((e) => entryToInsert(userId, e)));
  }

  // Backfill photo URLs onto existing hikes that don't have one yet. Guarded so
  // a not-yet-migrated photo_url column can't fail the whole hike sync.
  if (toUpdate.length > 0) {
    try {
      for (const u of toUpdate) {
        await db
          .update(hikes)
          .set({ photoUrl: u.photoUrl })
          .where(
            and(
              eq(hikes.userId, userId),
              eq(hikes.trailSlug, u.trailSlug),
              eq(hikes.hikedOn, u.hikedOn),
              isNull(hikes.photoUrl),
            ),
          );
      }
    } catch {
      // Best effort: photos backfill on the next sync once migrated.
    }
  }

  return NextResponse.json({ hikes: merged });
}

/**
 * Delete a single logged hike from the account (#229), identified by trail and
 * date, so a hike the member removes on My Hikes does not reappear on the next
 * sync. Sync is otherwise additive; this is the one path that deletes.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { trailSlug?: unknown; hikedOn?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const trailSlug = typeof body.trailSlug === "string" ? body.trailSlug : "";
  const hikedOn = typeof body.hikedOn === "string" ? body.hikedOn : "";
  if (!trailSlug || !hikedOn) {
    return NextResponse.json({ error: "Missing trail or date" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(hikes)
    .where(
      and(
        eq(hikes.userId, userId),
        eq(hikes.trailSlug, trailSlug),
        eq(hikes.hikedOn, hikedOn),
      ),
    );

  return NextResponse.json({ ok: true });
}
