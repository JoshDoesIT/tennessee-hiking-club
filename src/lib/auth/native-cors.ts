/**
 * CORS + bearer-token helpers for serving the API to the local app bundle
 * (spec 0009, phase 4). Loaded from `capacitor://localhost`, the app's API calls
 * are cross-origin, so the production API must answer CORS preflight for those
 * origins and accept the session as an `Authorization: Bearer` token (the
 * session cookie does not survive the WebView cross-origin, per #264). The
 * middleware translates that bearer token into the session cookie so `auth()`
 * and every route validate it unchanged.
 */

/** The Capacitor local origins the native bundle loads from. */
export const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
] as const;

export function isAllowedOrigin(origin: string | null): origin is string {
  return origin != null && (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

/** CORS headers for an allowed origin. No credentials: the session rides the
 *  Authorization header, not a cookie, so the origin is echoed (not `*`). */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    vary: "Origin",
  };
}

/** The Auth.js session cookie name (secure on production). */
export function sessionCookieName(
  secure: boolean = process.env.NODE_ENV === "production",
): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

/** Extract a `Bearer <token>` value from an Authorization header, or null. */
export function bearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer (.+)$/.exec(authHeader.trim());
  return match ? match[1] : null;
}

/** Merge the session cookie carrying `token` into an existing Cookie header so
 *  `auth()` reads it like any same-origin session. */
export function withSessionCookie(
  cookieHeader: string | null,
  token: string,
  secure?: boolean,
): string {
  const entry = `${sessionCookieName(secure)}=${token}`;
  return cookieHeader ? `${cookieHeader}; ${entry}` : entry;
}
