import { describe, it, expect, vi } from "vitest";

// JWT signing is covered in jwt.test.ts; stub it here so the transport tests can
// use placeholder keys and focus on routing, gating, and the HTTP shapes.
vi.mock("./jwt", () => ({
  apnsJwt: () => "apns.signed.jwt",
  fcmAuthJwt: () => "fcm.signed.jwt",
}));

import {
  pushConfigFromEnv,
  fcmMessage,
  apnsPayload,
  createPushSender,
  type PushConfig,
  type PushHttp,
} from "./transport";
import type { PushNotification } from "./payload";

const NOTE: PushNotification = {
  title: "Closure: Mount X",
  body: "Trail closed for storm damage.",
  data: { trailSlug: "mount-x", url: "/trails/mount-x" },
};

const APNS = {
  teamId: "T",
  keyId: "K",
  privateKey: "pk",
  topic: "club.tnhiking.app",
  host: "https://api.push.apple.com",
};
const FCM = { projectId: "proj", clientEmail: "svc@x", privateKey: "pk" };

function http(overrides: Partial<PushHttp> = {}): PushHttp {
  return {
    apnsPost: vi.fn(async () => ({ status: 200 })),
    fetch: vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("oauth2"))
        return {
          ok: true,
          json: async () => ({ access_token: "tok", expires_in: 3600 }),
        } as unknown as Response;
      return { ok: true, json: async () => ({}) } as unknown as Response;
    }),
    ...overrides,
  };
}

describe("pushConfigFromEnv", () => {
  it("builds APNs + FCM config and unescapes newline-encoded keys", () => {
    const cfg = pushConfigFromEnv({
      APNS_TEAM_ID: "T",
      APNS_KEY_ID: "K",
      APNS_PRIVATE_KEY: "line1\\nline2",
      FCM_PROJECT_ID: "proj",
      FCM_CLIENT_EMAIL: "svc@x",
      FCM_PRIVATE_KEY: "a\\nb",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg.apns?.privateKey).toBe("line1\nline2");
    expect(cfg.apns?.topic).toBe("club.tnhiking.app");
    expect(cfg.fcm?.privateKey).toBe("a\nb");
  });

  it("omits a provider when its vars are unset (no-op in CI/non-prod)", () => {
    expect(pushConfigFromEnv({} as unknown as NodeJS.ProcessEnv)).toEqual({});
  });
});

describe("payload shapes", () => {
  it("maps to the APNs aps payload with data", () => {
    expect(apnsPayload(NOTE)).toMatchObject({
      aps: { alert: { title: NOTE.title, body: NOTE.body } },
      url: "/trails/mount-x",
    });
  });
  it("maps to the FCM v1 message", () => {
    expect(fcmMessage({ token: "dev", platform: "android" }, NOTE)).toEqual({
      message: {
        token: "dev",
        notification: { title: NOTE.title, body: NOTE.body },
        data: { trailSlug: "mount-x", url: "/trails/mount-x" },
      },
    });
  });
});

describe("createPushSender", () => {
  const deps = (h: PushHttp) => ({ http: h, now: () => 1700000000 });

  it("sends an iOS device via APNs and reports success on 2xx", async () => {
    const h = http();
    const send = createPushSender({ apns: APNS } as PushConfig, deps(h));
    const ok = await send({ token: "devtoken", platform: "ios" }, NOTE);
    expect(ok).toBe(true);
    expect(h.apnsPost).toHaveBeenCalledWith(
      expect.objectContaining({ deviceToken: "devtoken", topic: "club.tnhiking.app" }),
    );
  });

  it("treats an APNs non-2xx as a failed send", async () => {
    const h = http({ apnsPost: vi.fn(async () => ({ status: 410 })) });
    const send = createPushSender({ apns: APNS } as PushConfig, deps(h));
    expect(await send({ token: "t", platform: "ios" }, NOTE)).toBe(false);
  });

  it("sends an Android device via FCM after fetching an OAuth token", async () => {
    const h = http();
    const send = createPushSender({ fcm: FCM } as PushConfig, deps(h));
    const ok = await send({ token: "devtoken", platform: "android" }, NOTE);
    expect(ok).toBe(true);
    const calls = (h.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u.includes("oauth2.googleapis.com/token"))).toBe(true);
    expect(calls.some((u) => u.includes("fcm.googleapis.com/v1/projects/proj/messages:send"))).toBe(true);
  });

  it("no-ops (returns false) when the platform's provider is unconfigured", async () => {
    const send = createPushSender({}, deps(http()));
    expect(await send({ token: "t", platform: "ios" }, NOTE)).toBe(false);
    expect(await send({ token: "t", platform: "android" }, NOTE)).toBe(false);
    expect(await send({ token: "t", platform: "web" }, NOTE)).toBe(false);
  });

  it("reuses a cached FCM token across sends", async () => {
    const h = http();
    const send = createPushSender({ fcm: FCM } as PushConfig, deps(h));
    await send({ token: "a", platform: "android" }, NOTE);
    await send({ token: "b", platform: "android" }, NOTE);
    const tokenCalls = (h.fetch as ReturnType<typeof vi.fn>).mock.calls.filter((c) =>
      String(c[0]).includes("oauth2"),
    );
    expect(tokenCalls).toHaveLength(1);
  });
});
