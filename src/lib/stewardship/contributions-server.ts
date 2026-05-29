import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import {
  aggregateContributions,
  contributionCountFor,
} from "@/lib/trails/contributions";
import { getApprovedSubmissionCount } from "@/lib/contributions/submissions-server";
import { getApprovedConditionCount } from "@/lib/contributions/conditions-server";
import { getApprovedPhotoCount } from "@/lib/contributions/photos-server";

/**
 * Recognized contribution count for a signed-in user. Earned and summed across:
 * curated content attributed to their verified GitHub login, and approved in-app
 * trail submissions (#146), condition reports (#149), and photos (#149), the
 * in-app ones credited by userId so a non-GitHub contributor is still
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
    const [fromSubmissions, fromConditions, fromPhotos] = await Promise.all([
      getApprovedSubmissionCount(userId),
      getApprovedConditionCount(userId),
      getApprovedPhotoCount(userId),
    ]);
    return fromContent + fromSubmissions + fromConditions + fromPhotos;
  } catch {
    return 0;
  }
}
