import { describe, it, expect, beforeEach } from "vitest";
import {
  putPhoto,
  getPhoto,
  deletePhoto,
  getAllPhotoIds,
  getPhotoDataUrl,
} from "./photo-store";

function reset(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase("thc");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

beforeEach(reset);

describe("photo-store (IndexedDB)", () => {
  it("round-trips a photo blob by id", async () => {
    const blob = new Blob(["jpeg-bytes"], { type: "image/jpeg" });
    await putPhoto("p1", blob);
    const got = await getPhoto("p1");
    expect(got).toBeInstanceOf(Blob);
    expect(await got!.text()).toBe("jpeg-bytes");
    expect(got!.type).toBe("image/jpeg");
  });

  it("returns undefined for an unknown id", async () => {
    expect(await getPhoto("missing")).toBeUndefined();
  });

  it("deletes a photo", async () => {
    await putPhoto("p1", new Blob(["x"], { type: "image/jpeg" }));
    await deletePhoto("p1");
    expect(await getPhoto("p1")).toBeUndefined();
  });

  it("lists all stored photo ids", async () => {
    await putPhoto("a", new Blob(["1"]));
    await putPhoto("b", new Blob(["2"]));
    expect((await getAllPhotoIds()).sort()).toEqual(["a", "b"]);
  });

  it("exposes a photo as a data URL", async () => {
    await putPhoto("p1", new Blob(["hi"], { type: "image/jpeg" }));
    expect(await getPhotoDataUrl("p1")).toMatch(/^data:image\/jpeg;base64,/);
    expect(await getPhotoDataUrl("missing")).toBeUndefined();
  });

  it("no-ops safely when IndexedDB is unavailable (SSR)", async () => {
    const saved = globalThis.indexedDB;
    // @ts-expect-error simulate a server/SSR environment
    delete globalThis.indexedDB;
    try {
      await expect(putPhoto("p1", new Blob(["x"]))).resolves.toBeUndefined();
      expect(await getPhoto("p1")).toBeUndefined();
      expect(await getAllPhotoIds()).toEqual([]);
    } finally {
      globalThis.indexedDB = saved;
    }
  });
});
