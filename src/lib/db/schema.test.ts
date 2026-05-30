import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { authenticators } from "./schema";

/**
 * The WebAuthn credential table (#168) must match the column names the Auth.js
 * Drizzle adapter reads/writes, or passkey registration and sign-in fail at
 * runtime. This guards the shape the adapter depends on.
 */
describe("authenticators table (WebAuthn)", () => {
  it("has the columns the Auth.js adapter requires", () => {
    const cols = Object.keys(getTableColumns(authenticators));
    for (const c of [
      "credentialID",
      "userId",
      "providerAccountId",
      "credentialPublicKey",
      "counter",
      "credentialDeviceType",
      "credentialBackedUp",
      "transports",
    ]) {
      expect(cols).toContain(c);
    }
  });
});
