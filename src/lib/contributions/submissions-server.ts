import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { trailSubmissions } from "@/lib/db/schema";

/**
 * Approved in-app submissions credited to a user (#146). Recognition is earned:
 * only submissions a maintainer approved count. These are summed with the
 * content-derived contribution count so non-GitHub contributors are recognized.
 */
export async function getApprovedSubmissionCount(
  userId: string,
): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const db = getDb();
  const rows = await db
    .select({ userId: trailSubmissions.userId })
    .from(trailSubmissions)
    .where(
      and(
        eq(trailSubmissions.userId, userId),
        eq(trailSubmissions.status, "approved"),
      ),
    );
  return rows.length;
}

/** Approved-submission counts for many users at once, keyed by userId. */
export async function getApprovedSubmissionCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!process.env.DATABASE_URL || userIds.length === 0) return counts;
  const db = getDb();
  const rows = await db
    .select({ userId: trailSubmissions.userId })
    .from(trailSubmissions)
    .where(
      and(
        inArray(trailSubmissions.userId, userIds),
        eq(trailSubmissions.status, "approved"),
      ),
    );
  for (const row of rows) {
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
  }
  return counts;
}
