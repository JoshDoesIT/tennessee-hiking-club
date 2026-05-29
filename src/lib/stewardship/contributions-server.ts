import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import {
  aggregateContributions,
  contributionCountFor,
} from "@/lib/trails/contributions";

/**
 * Recognized contribution count for a signed-in user, matched via their
 * captured GitHub login. Returns 0 when there is no database, no login, or on
 * error, so callers (the Trail Steward badge) stay resilient.
 */
export async function getContributionCountForUser(
  userId: string,
): Promise<number> {
  try {
    if (!process.env.DATABASE_URL) return 0;
    const db = getDb();
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const handle = row?.githubLogin;
    if (!handle) return 0;
    return contributionCountFor(aggregateContributions(getAllTrails()), handle);
  } catch {
    return 0;
  }
}
