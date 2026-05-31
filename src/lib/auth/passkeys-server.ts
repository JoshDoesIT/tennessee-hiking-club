import { eq } from "drizzle-orm";
import type { getDb } from "@/lib/db";
import { authenticators } from "@/lib/db/schema";

type Db = ReturnType<typeof getDb>;

/** How many WebAuthn passkeys a user has registered (#168). */
export async function countUserPasskeys(
  db: Db,
  userId: string,
): Promise<number> {
  const rows = await db
    .select({ id: authenticators.credentialID })
    .from(authenticators)
    .where(eq(authenticators.userId, userId));
  return rows.length;
}
