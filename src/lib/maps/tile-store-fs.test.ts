import { describe, it, expect, vi } from "vitest";
import {
  createFilesystemTileStore,
  bytesToBase64,
  base64ToBytes,
  type TileFilesystem,
} from "./tile-store-fs";

const buf = (s: string): ArrayBuffer => {
  const u = new TextEncoder().encode(s);
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);
};
const text = (b: ArrayBuffer) => new TextDecoder().decode(new Uint8Array(b));

describe("base64 round-trip", () => {
  it("preserves arbitrary binary bytes", () => {
    const original = new Uint8Array([0, 255, 1, 128, 64, 200, 13, 10]);
    const back = new Uint8Array(base64ToBytes(bytesToBase64(original.buffer)));
    expect(back).toEqual(original);
  });
});

function fakeFs() {
  const files = new Map<string, string>();
  const fs: TileFilesystem & { files: Map<string, string> } = {
    files,
    writeFile: vi.fn(async ({ path, data }) => {
      files.set(path, data);
      return { uri: path };
    }),
    readFile: vi.fn(async ({ path }) => {
      if (!files.has(path)) throw new Error("not found");
      return { data: files.get(path)! };
    }),
    stat: vi.fn(async ({ path }) => {
      if (!files.has(path)) throw new Error("not found");
      return { type: "file", size: 0, mtime: 0, uri: path };
    }),
  };
  return fs;
}

describe("createFilesystemTileStore", () => {
  it("reports absence, then stores and reads a tile's bytes", async () => {
    const fs = fakeFs();
    const store = createFilesystemTileStore(fs);
    expect(await store.has("k")).toBe(false);
    await store.write("k", buf("tile-bytes"));
    expect(await store.has("k")).toBe(true);
    expect(text(await store.read("k"))).toBe("tile-bytes");
  });

  it("writes under a tiles directory, creating it as needed", async () => {
    const fs = fakeFs();
    const store = createFilesystemTileStore(fs);
    await store.write("abc", buf("x"));
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: "tiles/abc", recursive: true }),
    );
  });
});
