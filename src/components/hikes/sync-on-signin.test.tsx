import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { SyncOnSignIn } from "./sync-on-signin";
import { addHike, readLog } from "@/lib/hikes/local-log";
import { logCleanup, getCleanups } from "@/lib/stewardship/cleanups";
import { getPhoto } from "@/lib/hikes/photo-store";
import { uploadPhoto } from "@/lib/hikes/photo-upload";

vi.mock("@/lib/hikes/photo-store", () => ({ getPhoto: vi.fn() }));
vi.mock("@/lib/hikes/photo-upload", () => ({ uploadPhoto: vi.fn() }));

type Resp = { ok: boolean; json: () => Promise<unknown> };

function setupFetch(
  session: unknown,
  syncResult: unknown,
  cleanupsResult: unknown = { cleanups: [] },
) {
  let syncBody: { hikes: { trailSlug: string }[] } | null = null;
  let cleanupsBody: { cleanups: { loggedOn: string }[] } | null = null;
  const fetchMock = vi.fn(
    async (url: string, init?: RequestInit): Promise<Resp> => {
      const path = String(url);
      if (path.includes("/api/auth/session")) {
        return { ok: true, json: async () => session };
      }
      if (path.includes("/api/hikes/sync")) {
        syncBody = init?.body ? JSON.parse(String(init.body)) : null;
        return { ok: true, json: async () => syncResult };
      }
      if (path.includes("/api/cleanups/sync")) {
        cleanupsBody = init?.body ? JSON.parse(String(init.body)) : null;
        return { ok: true, json: async () => cleanupsResult };
      }
      return { ok: false, json: async () => ({}) };
    },
  );
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return {
    fetchMock,
    getSyncBody: () => syncBody,
    getCleanupsBody: () => cleanupsBody,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(getPhoto).mockReset();
  vi.mocked(uploadPhoto).mockReset().mockResolvedValue(null);
});
afterEach(() => vi.unstubAllGlobals());

describe("SyncOnSignIn", () => {
  it("pushes the local log and adopts the merged result when signed in", async () => {
    addHike("a", "2026-01-01");
    const { getSyncBody } = setupFetch(
      { user: { id: "u1" } },
      {
        hikes: [
          { trailSlug: "a", hikedOn: "2026-01-01" },
          { trailSlug: "b", hikedOn: "2026-02-01" },
        ],
      },
    );

    render(<SyncOnSignIn />);

    await waitFor(() =>
      expect(readLog().map((e) => e.trailSlug).sort()).toEqual(["a", "b"]),
    );
    expect(getSyncBody()?.hikes[0].trailSlug).toBe("a");
  });

  it("pushes local cleanups and adopts the merged result when signed in", async () => {
    logCleanup("2026-05-01");
    const { getCleanupsBody } = setupFetch(
      { user: { id: "u1" } },
      { hikes: [] },
      { cleanups: [{ loggedOn: "2026-05-01" }, { loggedOn: "2026-05-02" }] },
    );

    render(<SyncOnSignIn />);

    await waitFor(() =>
      expect(
        getCleanups()
          .map((c) => c.loggedOn)
          .sort(),
      ).toEqual(["2026-05-01", "2026-05-02"]),
    );
    expect(getCleanupsBody()?.cleanups[0].loggedOn).toBe("2026-05-01");
  });

  it("preserves a local photoId across the sync round-trip", async () => {
    addHike("a", "2026-01-01", { photoId: "ph-1" });
    // Server doesn't store photoId, so its merged result lacks it.
    setupFetch(
      { user: { id: "u1" } },
      { hikes: [{ trailSlug: "a", hikedOn: "2026-01-01" }] },
    );

    render(<SyncOnSignIn />);

    await waitFor(() =>
      expect(readLog().find((e) => e.trailSlug === "a")?.photoId).toBe("ph-1"),
    );
  });

  it("uploads local-only photos after sign-in and records their URLs", async () => {
    addHike("a", "2026-01-01", { photoId: "ph-1" });
    vi.mocked(getPhoto).mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    vi.mocked(uploadPhoto).mockResolvedValue("https://b/p.jpg");
    const { fetchMock } = setupFetch(
      { user: { id: "u1" } },
      { hikes: [{ trailSlug: "a", hikedOn: "2026-01-01" }] },
    );

    render(<SyncOnSignIn />);

    await waitFor(() =>
      expect(readLog().find((e) => e.trailSlug === "a")?.photoUrl).toBe(
        "https://b/p.jpg",
      ),
    );
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    // A second hike-sync POST persists the backfilled URL to the account.
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter((c) =>
          String(c[0]).includes("/api/hikes/sync"),
        ).length,
      ).toBeGreaterThanOrEqual(2),
    );
  });

  it("does not sync when signed out", async () => {
    addHike("a", "2026-01-01");
    const { fetchMock } = setupFetch({}, { hikes: [] });

    render(<SyncOnSignIn />);

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((c) =>
          String(c[0]).includes("/api/auth/session"),
        ),
      ).toBe(true),
    );
    expect(
      fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/api/hikes/sync"),
      ),
    ).toHaveLength(0);
    expect(readLog().map((e) => e.trailSlug)).toEqual(["a"]);
  });
});
