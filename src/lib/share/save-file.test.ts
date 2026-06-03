import { describe, it, expect, vi, beforeEach } from "vitest";

const isNativePlatform = vi.hoisted(() => vi.fn(() => false));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const writeFile = vi.hoisted(() =>
  vi.fn(async () => ({ uri: "file:///tmp/route.gpx" })),
);
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile },
  Directory: { Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
}));

const share = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@capacitor/share", () => ({ Share: { share } }));

import { saveOrShareTextFile } from "./save-file";

beforeEach(() => {
  vi.clearAllMocks();
  isNativePlatform.mockReturnValue(false);
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:x",
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => {},
  });
});

describe("saveOrShareTextFile", () => {
  it("on the web, downloads via a blob (not the native plugins)", async () => {
    isNativePlatform.mockReturnValue(false);
    await saveOrShareTextFile("route.gpx", "<gpx/>", "application/gpx+xml");
    expect(writeFile).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
  });

  it("on native, writes the file and opens the share sheet", async () => {
    isNativePlatform.mockReturnValue(true);
    await saveOrShareTextFile("route.gpx", "<gpx/>", "application/gpx+xml");
    expect(writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: "route.gpx", data: "<gpx/>" }),
    );
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "file:///tmp/route.gpx" }),
    );
  });
});
