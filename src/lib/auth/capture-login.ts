import { profiles } from "@/lib/db/schema";
import type { getDb } from "@/lib/db";

type Db = ReturnType<typeof getDb>;

type SignInMessage = {
  user?: { id?: string | null };
  account?: { provider?: string } | null;
  profile?: unknown;
};

/**
 * Persist a GitHub user's login at sign-in so their curated contributions can
 * be recognized (earned, not self-claimed). No-op for non-GitHub sign-ins or
 * when the login is unavailable.
 */
export async function captureGithubLogin(
  message: SignInMessage,
  db: Db,
): Promise<void> {
  const userId = message.user?.id;
  if (message.account?.provider !== "github" || !userId) return;
  const login = (message.profile as { login?: unknown } | undefined)?.login;
  if (typeof login !== "string" || !login) return;

  await db
    .insert(profiles)
    .values({ userId, githubLogin: login })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { githubLogin: login },
    });
}
