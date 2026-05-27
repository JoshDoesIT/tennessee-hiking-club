import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { hikes } from "@/lib/db/schema";
import { planSync, rowToEntry, entryToInsert } from "@/lib/hikes/sync";

const bodySchema = z.object({
  hikes: z.array(
    z.object({
      trailSlug: z.string().min(1),
      hikedOn: z.string().min(1),
      note: z.string().optional(),
      conditions: z.string().optional(),
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
  const { toInsert, merged } = planSync(local, rows.map(rowToEntry));

  if (toInsert.length > 0) {
    await db.insert(hikes).values(toInsert.map((e) => entryToInsert(userId, e)));
  }

  return NextResponse.json({ hikes: merged });
}
