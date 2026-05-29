import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { isAdmin } from "./is-admin";

/**
 * Whether a signed-in user is a configured maintainer. There is no role system
 * yet, so admins are listed in `ADMIN_GITHUB_LOGINS` and matched against the
 * user's captured `profiles.githubLogin`. Resilient: returns false when there is
 * no database, no captured login, or on error.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false;
    const db = getDb();
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return isAdmin(row?.githubLogin ?? null);
  } catch {
    return false;
  }
}
