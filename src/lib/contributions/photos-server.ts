import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { photoSubmissions } from "@/lib/db/schema";

/**
 * Approved in-app photos credited to a user (#149). Recognition is earned: only
 * photos a maintainer approved count, toward the photo-credits board and the
 * Trail Steward badge.
 */
export async function getApprovedPhotoCount(userId: string): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const db = getDb();
  const rows = await db
    .select({ reviewStatus: photoSubmissions.reviewStatus })
    .from(photoSubmissions)
    .where(
      and(
        eq(photoSubmissions.userId, userId),
        eq(photoSubmissions.reviewStatus, "approved"),
      ),
    );
  // Published photos (#153) stop counting here; the content credits them.
  return rows.filter((r) => r.reviewStatus === "approved").length;
}

/** Approved photo counts for many users at once, keyed by userId. */
export async function getApprovedPhotoCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!process.env.DATABASE_URL || userIds.length === 0) return counts;
  const db = getDb();
  const rows = await db
    .select({
      userId: photoSubmissions.userId,
      reviewStatus: photoSubmissions.reviewStatus,
    })
    .from(photoSubmissions)
    .where(
      and(
        inArray(photoSubmissions.userId, userIds),
        eq(photoSubmissions.reviewStatus, "approved"),
      ),
    );
  for (const row of rows) {
    if (row.reviewStatus !== "approved") continue;
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
  }
  return counts;
}
