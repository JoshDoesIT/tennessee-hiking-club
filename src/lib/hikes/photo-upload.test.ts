import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadPhoto, deleteRemotePhoto } from "./photo-upload";

afterEach(() => vi.unstubAllGlobals());

const ok = (body: unknown) =>
  vi.fn<(input?: unknown, init?: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), { status: 200 }),
  );

describe("uploadPhoto", () => {
  it("posts the blob and returns the url on success", async () => {
    const fetchMock = ok({ url: "https://b/p.jpg" });
    vi.stubGlobal("fetch", fetchMock);

    const url = await uploadPhoto(new Blob(["x"], { type: "image/jpeg" }));

    expect(url).toBe("https://b/p.jpg");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/hikes/photo");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
  });

  it("returns null when the server has no Blob store (url: null)", async () => {
    vi.stubGlobal("fetch", ok({ url: null }));
    expect(await uploadPhoto(new Blob(["x"], { type: "image/jpeg" }))).toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    expect(await uploadPhoto(new Blob(["x"]))).toBeNull();
  });

  it("returns null when the request throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    expect(await uploadPhoto(new Blob(["x"]))).toBeNull();
  });
});

describe("deleteRemotePhoto", () => {
  it("sends a DELETE with the url", async () => {
    const fetchMock = ok({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await deleteRemotePhoto("https://b/p.jpg");

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/hikes/photo");
    expect(init?.method).toBe("DELETE");
    expect(JSON.parse(String(init?.body))).toEqual({ url: "https://b/p.jpg" });
  });

  it("swallows network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    await expect(deleteRemotePhoto("https://b/p.jpg")).resolves.toBeUndefined();
  });
});
