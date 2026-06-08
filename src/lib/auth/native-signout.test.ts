import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const signOut = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("next-auth/react", () => ({ signOut }));

const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const clearToken = vi.hoisted(() => vi.fn());
vi.mock("./token-store", () => ({ clearToken }));
vi.mock("./secure-store", () => ({ capacitorSecureStore: { fake: true } }));

import { appSignOut } from "./native-signout";

const assign = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("location", { assign });
});
afterEach(() => vi.unstubAllGlobals());

describe("appSignOut", () => {
  it("does the normal cookie sign-out on the web", async () => {
    isNativePlatform.mockReturnValue(false);
    await appSignOut();
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    expect(clearToken).not.toHaveBeenCalled();
  });

  it("ends the server session then clears the stored token on native", async () => {
    isNativePlatform.mockReturnValue(true);
    await appSignOut();
    // redirect: false so the bearer can still authenticate the sign-out request.
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(clearToken).toHaveBeenCalledWith({ fake: true });
    expect(assign).toHaveBeenCalledWith("/");
  });
});
