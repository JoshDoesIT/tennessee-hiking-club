import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const browserOpen = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const browserClose = vi.fn<(...args: unknown[]) => Promise<void>>(
  async () => {},
);
vi.mock("@capacitor/browser", () => ({
  Browser: {
    open: (...a: unknown[]) => browserOpen(...a),
    close: (...a: unknown[]) => browserClose(...a),
  },
}));

let urlOpenCb: ((e: { url: string }) => void | Promise<void>) | null = null;
const remove = vi.fn();
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn(async (_evt: string, cb: typeof urlOpenCb) => {
      urlOpenCb = cb;
      return { remove };
    }),
  },
}));

const storeToken = vi.hoisted(() => vi.fn());
vi.mock("./token-store", () => ({ storeToken }));
vi.mock("./secure-store", () => ({ capacitorSecureStore: { fake: true } }));

import { startNativeSignIn } from "./native-signin";

let assign: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  urlOpenCb = null;
  browserOpen.mockClear();
  browserClose.mockClear();
  remove.mockClear();
  storeToken.mockClear();
  assign = vi.fn();
  fetchMock = vi.fn(
    async () =>
      ({
        ok: true,
        json: async () => ({ sessionToken: "sess-tok" }),
      }) as unknown as Response,
  );
  vi.stubGlobal("location", { assign });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("startNativeSignIn", () => {
  it("opens the system browser to the OAuth flow targeting the completion route", async () => {
    await startNativeSignIn("github");
    expect(browserOpen).toHaveBeenCalledTimes(1);
    const { url } = (browserOpen.mock.calls[0] as unknown as [{ url: string }])[0];
    expect(url).toContain("/api/app-signin/github");
    expect(url).toContain(`to=${encodeURIComponent("/api/native-auth/complete")}`);
  });

  it("exchanges the deep-linked code for a session and lands on My Hikes", async () => {
    await startNativeSignIn("github");
    await urlOpenCb?.({ url: "tnhc://auth?code=abc123" });
    expect(browserClose).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/native-auth/exchange",
      expect.objectContaining({ method: "POST" }),
    );
    const init = (fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1];
    expect(JSON.parse(init.body)).toEqual({ code: "abc123" });
    // The returned session token is stored for the bearer-header path (phase 4).
    expect(storeToken).toHaveBeenCalledWith(expect.anything(), "sess-tok");
    expect(assign).toHaveBeenCalledWith("/hikes");
  });

  it("sends the user to the sign-in error page when the deep link has no code", async () => {
    await startNativeSignIn("github");
    await urlOpenCb?.({ url: "tnhc://auth?error=unauthenticated" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/signin"));
  });
});
