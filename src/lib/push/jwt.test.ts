import { describe, it, expect } from "vitest";
import { generateKeyPairSync, verify } from "node:crypto";
import { apnsJwt, fcmAuthJwt } from "./jwt";

const decode = (seg: string) =>
  JSON.parse(Buffer.from(seg, "base64url").toString());

describe("apnsJwt", () => {
  it("builds an ES256 token with the key id and team, verifiable by the public key", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

    const jwt = apnsJwt({
      teamId: "TEAM123456",
      keyId: "KEY7890",
      privateKey: pem,
      now: 1700000000,
    });

    const [h, c, s] = jwt.split(".");
    expect(decode(h)).toEqual({ alg: "ES256", kid: "KEY7890" });
    expect(decode(c)).toEqual({ iss: "TEAM123456", iat: 1700000000 });
    const ok = verify(
      "sha256",
      Buffer.from(`${h}.${c}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(s, "base64url"),
    );
    expect(ok).toBe(true);
  });
});

describe("fcmAuthJwt", () => {
  it("builds an RS256 service-account assertion for the Google token endpoint", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

    const jwt = fcmAuthJwt({
      clientEmail: "svc@project.iam.gserviceaccount.com",
      privateKey: pem,
      now: 1700000000,
    });

    const [h, c, s] = jwt.split(".");
    expect(decode(h)).toMatchObject({ alg: "RS256", typ: "JWT" });
    const claims = decode(c);
    expect(claims.iss).toBe("svc@project.iam.gserviceaccount.com");
    expect(claims.aud).toBe("https://oauth2.googleapis.com/token");
    expect(claims.scope).toContain("firebase.messaging");
    expect(claims.exp - claims.iat).toBe(3600);
    const ok = verify(
      "RSA-SHA256",
      Buffer.from(`${h}.${c}`),
      publicKey,
      Buffer.from(s, "base64url"),
    );
    expect(ok).toBe(true);
  });
});
