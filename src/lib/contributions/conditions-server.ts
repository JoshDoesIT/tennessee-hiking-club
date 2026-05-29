import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { conditionSubmissions } from "@/lib/db/schema";

/**
 * Approved in-app condition reports credited to a user (#149). Recognition is
 * earned: only reports a maintainer approved count, toward the "conditions
 * reported" board and the Trail Steward badge.
 */
export async function getApprovedConditionCount(
  userId: string,
): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const db = getDb();
  const rows = await db
    .select({ userId: conditionSubmissions.userId })
    .from(conditionSubmissions)
    .where(
      and(
        eq(conditionSubmissions.userId, userId),
        eq(conditionSubmissions.reviewStatus, "approved"),
      ),
    );
  return rows.length;
}

/** Approved condition-report counts for many users at once, keyed by userId. */
export async function getApprovedConditionCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!process.env.DATABASE_URL || userIds.length === 0) return counts;
  const db = getDb();
  const rows = await db
    .select({ userId: conditionSubmissions.userId })
    .from(conditionSubmissions)
    .where(
      and(
        inArray(conditionSubmissions.userId, userIds),
        eq(conditionSubmissions.reviewStatus, "approved"),
      ),
    );
  for (const row of rows) {
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
  }
  return counts;
}
