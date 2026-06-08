import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCachedToken,
  loadToken,
  storeToken,
  clearToken,
} from "./token-store";

function fakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get: vi.fn(async (k: string) => data.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      data.set(k, v);
    }),
    remove: vi.fn(async (k: string) => {
      data.delete(k);
    }),
  };
}

const KEY = "thc.session-token";

beforeEach(async () => {
  // Reset the module-level cache between tests.
  await clearToken(fakeStore());
});

describe("token store", () => {
  it("has no cached token to start", () => {
    expect(getCachedToken()).toBeNull();
  });

  it("loads a persisted token into the in-memory cache", async () => {
    await loadToken(fakeStore({ [KEY]: "tok" }));
    expect(getCachedToken()).toBe("tok");
  });

  it("stores a token in both the cache and the secure store", async () => {
    const store = fakeStore();
    await storeToken(store, "tok");
    expect(getCachedToken()).toBe("tok");
    expect(store.data.get(KEY)).toBe("tok");
  });

  it("clears the token from the cache and the secure store", async () => {
    const store = fakeStore({ [KEY]: "tok" });
    await loadToken(store);
    await clearToken(store);
    expect(getCachedToken()).toBeNull();
    expect(store.data.has(KEY)).toBe(false);
  });
});
