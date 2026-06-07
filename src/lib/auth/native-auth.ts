import { and, eq } from "drizzle-orm";
import type { getDb } from "@/lib/db";
import { sessions, verificationTokens } from "@/lib/db/schema";

/**
 * Native sign-in bridge (#276). OAuth runs in the system browser (where cookies
 * work); a short-lived, single-use code then carries the result back to the app,
 * which exchanges it for a real session cookie set on a same-origin request the
 * WebView keeps. This module is the server side of that bridge.
 */
type Db = ReturnType<typeof getDb>;

const CODE_PREFIX = "native-auth:";
const CODE_TTL_MS = 90_000; // 90s: just long enough to deep-link back to the app
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matching Auth.js

/** A 256-bit random hex token, for both the one-time code and the session id. */
function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Mint a single-use code for `userId`, stored (reusing the verification-token
 *  table, so no new migration) with a short expiry. */
export async function mintAuthCode(
  db: Db,
  userId: string,
  now = Date.now(),
): Promise<string> {
  const code = randomToken();
  await db.insert(verificationTokens).values({
    identifier: CODE_PREFIX + userId,
    token: code,
    expires: new Date(now + CODE_TTL_MS),
  });
  return code;
}

/** Validate and consume a code. Returns the user id, or null if the code is
 *  unknown, not a native-auth code, or expired. Always single-use: a matching
 *  code is deleted whether or not it had expired. */
export async function consumeAuthCode(
  db: Db,
  code: string,
  now = Date.now(),
): Promise<string | null> {
  const rows = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, code));
  const row = rows[0];
  if (!row || !row.identifier.startsWith(CODE_PREFIX)) return null;
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, row.identifier),
        eq(verificationTokens.token, code),
      ),
    );
  if (row.expires.getTime() < now) return null;
  return row.identifier.slice(CODE_PREFIX.length);
}

/** Create a database session for `userId` and return its session token. */
export async function createSession(
  db: Db,
  userId: string,
  now = Date.now(),
): Promise<string> {
  const sessionToken = randomToken();
  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires: new Date(now + SESSION_TTL_MS),
  });
  return sessionToken;
}

/** The session cookie to set, matching Auth.js's name and options so the
 *  existing `auth()` reads it. */
export function sessionCookie(sessionToken: string, now = Date.now()) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
    value: sessionToken,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure,
      expires: new Date(now + SESSION_TTL_MS),
    },
  };
}
