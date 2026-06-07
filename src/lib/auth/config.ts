import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Passkey from "next-auth/providers/passkey";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import { getDb } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators,
} from "@/lib/db/schema";
import { captureGithubLogin } from "@/lib/auth/capture-login";

/**
 * Builds the Auth.js (NextAuth v5) config. Kept separate from the `NextAuth()`
 * init in `src/auth.ts` (which pulls in `next/server`) so the provider/adapter
 * wiring stays unit-testable.
 *
 * Providers read their own `AUTH_<PROVIDER>_ID` / `_SECRET`, so each is included
 * only when its credentials exist. The Drizzle adapter and passkeys light up
 * only when a database is configured, which keeps builds working before the
 * secrets exist (e.g. CI) while enabling sign-in wherever they are present.
 */
export function buildAuthConfig(): NextAuthConfig {
  const providers: NextAuthConfig["providers"] = [];
  // Link a GitHub and a Google login that share the same email to one account,
  // instead of failing with OAuthAccountNotLinked when a member signs in with
  // their "other" provider. Safe here because both providers only return
  // verified emails.
  if (process.env.AUTH_GITHUB_ID)
    providers.push(GitHub({ allowDangerousEmailAccountLinking: true }));
  if (process.env.AUTH_GOOGLE_ID)
    providers.push(Google({ allowDangerousEmailAccountLinking: true }));
  // Facebook lowers sign-in friction for the club's Facebook-group members, but
  // it does not guarantee a verified email, so it is left without
  // `allowDangerousEmailAccountLinking` to avoid linking into an account made
  // with a verified-email provider.
  if (process.env.AUTH_FACEBOOK_ID) providers.push(Facebook);

  const config: NextAuthConfig = {
    providers,
    trustHost: true,
    callbacks: {
      session({ session, user }) {
        if (user?.id && session.user) session.user.id = user.id;
        return session;
      },
    },
  };

  // In the native WebView (Capacitor), the OAuth state / PKCE / nonce cookies
  // must survive the cross-site redirect back from the provider. SameSite=Lax
  // can be dropped there, which surfaces as an Auth.js "Configuration" error in
  // the app even though web sign-in works (#264). Loosen just those short-lived
  // check cookies to SameSite=None in production, where they are also Secure
  // (which None requires); the deep merge with Auth.js's defaults keeps their
  // names, the secure flag, and max-age. Skipped outside production because
  // None without Secure (local http) would be rejected.
  if (process.env.NODE_ENV === "production") {
    config.cookies = {
      pkceCodeVerifier: { options: { sameSite: "none" } },
      state: { options: { sameSite: "none" } },
      nonce: { options: { sameSite: "none" } },
    };
  }

  if (process.env.DATABASE_URL) {
    config.adapter = DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
      authenticatorsTable: authenticators,
    });
    // Passkeys (WebAuthn) need the adapter's authenticator store, so enable them
    // only alongside the database. The provider auto-derives its relying party
    // (id/origin) from the request host, like `trustHost`.
    config.experimental = { enableWebAuthn: true };
    providers.push(Passkey);

    // Record a GitHub user's login at sign-in so their contributions can be
    // recognized. Best-effort: failures must not block sign-in.
    config.events = {
      async signIn(message) {
        try {
          await captureGithubLogin(message, getDb());
        } catch {
          // ignore
        }
      },
    };
  }

  return config;
}
