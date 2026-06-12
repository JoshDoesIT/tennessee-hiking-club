import { describe, it, expect, vi } from "vitest";
import {
  postSubscription,
  unsubscribeDevice,
  registerForPushNotifications,
} from "./register";

// In jsdom, Capacitor.isNativePlatform() is false, so registration takes the
// web fallback. The native APNs/FCM path is verified on a device.

describe("postSubscription", () => {
  it("POSTs the token and platform to the register endpoint", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response);
    const ok = await postSubscription("tok-1", "ios", fetchImpl);
    expect(ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/push/register");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      token: "tok-1",
      platform: "ios",
    });
  });

  it("returns false when the server rejects it", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false }) as Response);
    expect(await postSubscription("tok", "android", fetchImpl)).toBe(false);
  });
});

describe("unsubscribeDevice", () => {
  it("DELETEs the token from the register endpoint", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response);
    const ok = await unsubscribeDevice("tok-1", fetchImpl);
    expect(ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/push/register");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ token: "tok-1" });
  });
});

describe("registerForPushNotifications (web fallback)", () => {
  it("reports unsupported on the web", async () => {
    const result = await registerForPushNotifications();
    expect(result).toEqual({ supported: false, status: "unsupported" });
  });
});
