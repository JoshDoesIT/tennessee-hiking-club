import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The committed `.env.example` is the template contributors copy to `.env.local`.
// Each sign-in provider in `config.ts` turns on only when its `AUTH_<X>_ID` is
// set, so a new provider added there must also be documented here. This guards
// that drift: add a provider, document its env var, or this fails. Paths resolve
// from the repo root, which is vitest's working directory.
const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
const config = readFileSync(
  resolve(process.cwd(), "src/lib/auth/config.ts"),
  "utf8",
);

describe(".env.example", () => {
  it("documents every AUTH_*_ID provider key the auth config branches on", () => {
    const keys = [...new Set([...config.matchAll(/AUTH_[A-Z]+_ID/g)].map((m) => m[0]))];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(example, `${key} is referenced in config.ts but missing from .env.example`).toContain(key);
    }
  });
});
