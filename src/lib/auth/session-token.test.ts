import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

const secret = "test-secret";
const payload = { sub: "u1", name: "Josh", picture: "https://x/p.png" };

describe("session token", () => {
  it("round-trips a payload that was signed with the same secret", () => {
    const token = createSessionToken(payload, secret);
    expect(verifySessionToken(token, secret)).toEqual(payload);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(payload, secret);
    expect(verifySessionToken(token, "other-secret")).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = createSessionToken(payload, secret);
    const [, sig] = token.split(".");
    const forged =
      Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url") +
      "." +
      sig;
    expect(verifySessionToken(forged, secret)).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(verifySessionToken("nonsense", secret)).toBeNull();
    expect(verifySessionToken("", secret)).toBeNull();
  });
});
