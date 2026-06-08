import { describe, it, expect, vi, beforeEach } from "vitest";

const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const loadToken = vi.hoisted(() => vi.fn());
vi.mock("./token-store", () => ({ loadToken }));
vi.mock("./secure-store", () => ({ capacitorSecureStore: { fake: true } }));

import { initNativeAuth } from "./native-session-init";

beforeEach(() => vi.clearAllMocks());

describe("initNativeAuth", () => {
  it("loads the persisted token from the secure store on native", async () => {
    isNativePlatform.mockReturnValue(true);
    await initNativeAuth();
    expect(loadToken).toHaveBeenCalledWith({ fake: true });
  });

  it("does nothing on the web (and never touches the secure store)", async () => {
    isNativePlatform.mockReturnValue(false);
    await initNativeAuth();
    expect(loadToken).not.toHaveBeenCalled();
  });
});
