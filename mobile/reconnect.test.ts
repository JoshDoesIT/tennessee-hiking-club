import { describe, it, expect, vi } from "vitest";
import { checkReachable, createReconnector, APP_URL } from "./reconnect.js";

describe("checkReachable", () => {
  it("reports reachable when the probe request resolves", async () => {
    const fetchImpl = vi.fn(async () => ({}) as Response);
    const ok = await checkReachable({ fetchImpl, now: () => 1 });
    expect(ok).toBe(true);
    // A cache-busted, cross-origin probe that needs no CORS and is never cached.
    expect(fetchImpl).toHaveBeenCalledWith(
      `${APP_URL}/favicon.ico?reconnect=1`,
      expect.objectContaining({ mode: "no-cors", cache: "no-store" }),
    );
  });

  it("reports unreachable when the probe rejects (offline)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await checkReachable({ fetchImpl })).toBe(false);
  });

  it("aborts and reports unreachable when the probe exceeds the timeout", async () => {
    vi.useFakeTimers();
    try {
      // Only settles when its abort signal fires, so the timeout is what ends it.
      const fetchImpl = vi.fn(
        (_input: string, init?: RequestInit): Promise<unknown> =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      );
      const result = checkReachable({ fetchImpl, timeoutMs: 4000 });
      await vi.advanceTimersByTimeAsync(4000);
      expect(await result).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("createReconnector", () => {
  it("reopens once the online event fires and the site is reachable", async () => {
    let onlineHandler: () => unknown = async () => undefined;
    const navigate = vi.fn();
    createReconnector({
      navigate,
      check: async () => true,
      addOnline: (h) => {
        onlineHandler = h;
      },
      removeOnline: () => {},
    });
    await onlineHandler();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("does not reopen when still unreachable, and reports it", async () => {
    const navigate = vi.fn();
    const onStillOffline = vi.fn();
    const r = createReconnector({
      navigate,
      check: async () => false,
      onStillOffline,
      addOnline: () => {},
      removeOnline: () => {},
    });
    await r.attempt();
    expect(navigate).not.toHaveBeenCalled();
    expect(onStillOffline).toHaveBeenCalledTimes(1);
  });

  it("ignores overlapping attempts while a probe is in flight", async () => {
    let resolveCheck: (v: boolean) => void = () => {};
    const check = vi.fn(
      () => new Promise<boolean>((res) => (resolveCheck = res)),
    );
    const navigate = vi.fn();
    const r = createReconnector({
      navigate,
      check,
      addOnline: () => {},
      removeOnline: () => {},
    });
    const first = r.attempt();
    const second = r.attempt();
    resolveCheck(true);
    await Promise.all([first, second]);
    expect(check).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
