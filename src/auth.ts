import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

/**
 * Auth.js (NextAuth v5) with Google and GitHub. Providers read their own
 * `AUTH_<PROVIDER>_ID` / `_SECRET` env vars; each is included only when its
 * credentials are present, and the Drizzle adapter is wired only when a
 * database is configured. This keeps builds working before the secrets exist
 * (e.g. CI) while lighting up sign-in in any environment that has them.
 */
function buildConfig(): NextAuthConfig {
  const providers: NextAuthConfig["providers"] = [];
  if (process.env.AUTH_GITHUB_ID) providers.push(GitHub);
  if (process.env.AUTH_GOOGLE_ID) providers.push(Google);

  const config: NextAuthConfig = { providers, trustHost: true };

  if (process.env.DATABASE_URL) {
    config.adapter = DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });
  }

  return config;
}

export const { handlers, auth, signIn, signOut } = NextAuth(buildConfig());
