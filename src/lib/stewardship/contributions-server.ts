import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import {
  aggregateContributions,
  contributionCountFor,
} from "@/lib/trails/contributions";
import { getApprovedSubmissionCount } from "@/lib/contributions/submissions-server";

/**
 * Recognized contribution count for a signed-in user. Earned two ways, summed:
 * curated content attributed to their verified GitHub login, and approved in-app
 * submissions (#146) credited by userId, so a non-GitHub contributor is still
 * recognized. Returns 0 when there is no database or on error, so callers (the
 * Trail Steward badge) stay resilient.
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
    const fromContent = handle
      ? contributionCountFor(aggregateContributions(getAllTrails()), handle)
      : 0;
    const fromSubmissions = await getApprovedSubmissionCount(userId);
    return fromContent + fromSubmissions;
  } catch {
    return 0;
  }
}
