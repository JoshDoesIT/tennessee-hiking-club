import crypto from "node:crypto";

/**
 * Minimal signed session token: `base64url(json).base64url(hmacSHA256)`. Not a
 * full JWT, just enough to store the signed-in user in an httpOnly cookie
 * without a userinfo call on every render. Tamper-evident via the HMAC.
 */
function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken<T>(payload: T, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifySessionToken<T = unknown>(
  token: string,
  secret: string,
): T | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, secret);
  if (signature.length !== expected.length) return null;
  if (
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}
