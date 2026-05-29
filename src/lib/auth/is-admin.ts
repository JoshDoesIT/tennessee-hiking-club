/**
 * Maintainer gate. There is no role system yet, so admins are configured via the
 * `ADMIN_GITHUB_LOGINS` environment variable (comma-separated GitHub logins),
 * matched against a user's captured `profiles.githubLogin`. Pure and
 * case-insensitive; the `allowlist` argument defaults to the env var so callers
 * can omit it in production and pass a literal in tests.
 */
export function parseAdminLogins(raw: string | null | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdmin(
  githubLogin: string | null | undefined,
  allowlist: string | null | undefined = process.env.ADMIN_GITHUB_LOGINS,
): boolean {
  if (!githubLogin) return false;
  return parseAdminLogins(allowlist).has(githubLogin.trim().toLowerCase());
}
