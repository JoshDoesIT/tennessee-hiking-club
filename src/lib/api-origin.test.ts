import { describe, it, expect, vi, afterEach } from "vitest";

const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

import { installApiOriginRewrite, API_ORIGIN } from "./api-origin";

type FakeWin = { location: { origin: string }; fetch: typeof fetch };

function fakeWindow(origin: string): FakeWin {
  return {
    location: { origin },
    fetch: vi.fn(async () => ({ ok: true }) as Response) as unknown as typeof fetch,
  };
}

afterEach(() => isNativePlatform.mockReturnValue(false));

describe("installApiOriginRewrite", () => {
  it("does not touch fetch on the web", () => {
    isNativePlatform.mockReturnValue(false);
    const win = fakeWindow("https://example.test");
    const original = win.fetch;
    installApiOriginRewrite(win as unknown as Window & typeof globalThis);
    expect(win.fetch).toBe(original);
  });

  it("does not rewrite when the native app already loads the production origin", () => {
    isNativePlatform.mockReturnValue(true);
    const win = fakeWindow(API_ORIGIN);
    const original = win.fetch;
    installApiOriginRewrite(win as unknown as Window & typeof globalThis);
    expect(win.fetch).toBe(original);
  });

  it("rewrites relative /api calls to the production origin in a local bundle", async () => {
    isNativePlatform.mockReturnValue(true);
    const win = fakeWindow("capacitor://localhost");
    const original = win.fetch;
    installApiOriginRewrite(win as unknown as Window & typeof globalThis);
    expect(win.fetch).not.toBe(original);

    await win.fetch("/api/hikes/sync", { method: "POST" });
    expect(original).toHaveBeenCalledWith(
      `${API_ORIGIN}/api/hikes/sync`,
      { method: "POST" },
    );

    await win.fetch("/trails/foo");
    expect(original).toHaveBeenLastCalledWith("/trails/foo", undefined);
  });

  it("is idempotent (no double-wrapping)", () => {
    isNativePlatform.mockReturnValue(true);
    const win = fakeWindow("capacitor://localhost");
    installApiOriginRewrite(win as unknown as Window & typeof globalThis);
    const once = win.fetch;
    installApiOriginRewrite(win as unknown as Window & typeof globalThis);
    expect(win.fetch).toBe(once);
  });
});
