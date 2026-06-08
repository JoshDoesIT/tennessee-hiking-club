import { describe, it, expect, vi, beforeEach } from "vitest";

const plugin = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(async () => ({ value: true })),
  remove: vi.fn(async () => ({ value: true })),
}));
vi.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: plugin,
}));

import { capacitorSecureStore } from "./secure-store";

beforeEach(() => vi.clearAllMocks());

describe("capacitorSecureStore", () => {
  it("returns the stored value", async () => {
    plugin.get.mockResolvedValue({ value: "tok" });
    expect(await capacitorSecureStore.get("k")).toBe("tok");
    expect(plugin.get).toHaveBeenCalledWith({ key: "k" });
  });

  it("maps the plugin's not-found throw to null", async () => {
    plugin.get.mockRejectedValue(new Error("not found"));
    expect(await capacitorSecureStore.get("k")).toBeNull();
  });

  it("sets and removes by key", async () => {
    await capacitorSecureStore.set("k", "v");
    expect(plugin.set).toHaveBeenCalledWith({ key: "k", value: "v" });
    await capacitorSecureStore.remove("k");
    expect(plugin.remove).toHaveBeenCalledWith({ key: "k" });
  });
});
