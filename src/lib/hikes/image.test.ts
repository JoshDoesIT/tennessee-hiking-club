import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fitWithin,
  blobToDataUrl,
  dataUrlToBlob,
  compressImage,
} from "./image";

describe("fitWithin", () => {
  it("leaves dimensions untouched when within the max edge", () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it("scales a landscape image down to the max long edge, preserving ratio", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it("scales a portrait image by its longest (height) edge", () => {
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });
});

describe("blobToDataUrl / dataUrlToBlob", () => {
  it("round-trips a blob's bytes and mime type", async () => {
    const blob = new Blob(["hello hikers"], { type: "image/jpeg" });
    const dataUrl = await blobToDataUrl(blob);
    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);

    const restored = dataUrlToBlob(dataUrl);
    expect(restored.type).toBe("image/jpeg");
    expect(await restored.text()).toBe("hello hikers");
  });
});

describe("compressImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the original file unchanged when canvas APIs are unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const file = new Blob(["original"], { type: "image/png" });
    expect(await compressImage(file)).toBe(file);
  });

  it("downscales to the max edge and re-encodes as JPEG", async () => {
    const canvases: { width: number; height: number }[] = [];
    const drawImage = vi.fn();
    class FakeOffscreenCanvas {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        canvases.push(this);
      }
      getContext() {
        return { drawImage };
      }
      convertToBlob(opts: { type: string }) {
        return Promise.resolve(new Blob(["jpeg-bytes"], { type: opts.type }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
    vi.stubGlobal("createImageBitmap", async () => ({
      width: 4000,
      height: 3000,
      close: vi.fn(),
    }));

    const out = await compressImage(new Blob(["raw"], { type: "image/png" }), {
      maxEdge: 1280,
    });

    expect(out.type).toBe("image/jpeg");
    expect(canvases.at(-1)).toMatchObject({ width: 1280, height: 960 });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1280, 960);
  });
});
