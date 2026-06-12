import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { cleanups } from "@/lib/db/schema";
import {
  planCleanupSync,
  rowToCleanup,
  cleanupToInsert,
} from "@/lib/stewardship/cleanups-sync";

const bodySchema = z.object({
  cleanups: z.array(z.object({ loggedOn: z.string().min(1) })),
});

/**
 * Sync the local cleanup log with the signed-in account: add any local
 * cleanup days the account is missing, then return the merged log for the
 * client to adopt. Additive only; one credit per day.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let local;
  try {
    local = bodySchema.parse(await req.json()).cleanups;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(cleanups)
    .where(eq(cleanups.userId, userId));
  const { toInsert, merged } = planCleanupSync(local, rows.map(rowToCleanup));

  if (toInsert.length > 0) {
    await db
      .insert(cleanups)
      .values(toInsert.map((c) => cleanupToInsert(userId, c)));
  }

  return NextResponse.json({ cleanups: merged });
}
