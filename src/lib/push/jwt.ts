import { sign } from "node:crypto";

/**
 * The two provider auth tokens for the push transport (#218, spec 0008), built
 * with Node crypto so no extra dependency is needed:
 *  - APNs: a short ES256 provider token (Apple's "token-based" auth).
 *  - FCM: an RS256 service-account assertion, exchanged for an OAuth token.
 */

const segment = (obj: object): string =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

/** APNs provider JWT: header `{alg:ES256, kid}`, claims `{iss:teamId, iat}`. */
export function apnsJwt(opts: {
  teamId: string;
  keyId: string;
  privateKey: string;
  now: number;
}): string {
  const input = `${segment({ alg: "ES256", kid: opts.keyId })}.${segment({
    iss: opts.teamId,
    iat: opts.now,
  })}`;
  const signature = sign("sha256", Buffer.from(input), {
    key: opts.privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${input}.${signature.toString("base64url")}`;
}

/** Service-account JWT for the Google OAuth token exchange (FCM HTTP v1). */
export function fcmAuthJwt(opts: {
  clientEmail: string;
  privateKey: string;
  now: number;
}): string {
  const input = `${segment({ alg: "RS256", typ: "JWT" })}.${segment({
    iss: opts.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: opts.now,
    exp: opts.now + 3600,
  })}`;
  const signature = sign("RSA-SHA256", Buffer.from(input), opts.privateKey);
  return `${input}.${signature.toString("base64url")}`;
}
