import NextAuth from "next-auth";
import { buildAuthConfig } from "@/lib/auth/config";

/**
 * Auth.js (NextAuth v5): GitHub + Google OAuth, plus passkeys (WebAuthn) when a
 * database is configured. The config lives in `@/lib/auth/config` so it can be
 * unit-tested without pulling in `next/server`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig());
