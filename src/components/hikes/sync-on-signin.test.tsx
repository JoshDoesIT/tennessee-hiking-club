import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { SyncOnSignIn } from "./sync-on-signin";
import { addHike, readLog } from "@/lib/hikes/local-log";

type Resp = { ok: boolean; json: () => Promise<unknown> };

function setupFetch(session: unknown, syncResult: unknown) {
  let syncBody: { hikes: { trailSlug: string }[] } | null = null;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit): Promise<Resp> => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session };
    }
    if (path.includes("/api/hikes/sync")) {
      syncBody = init?.body ? JSON.parse(String(init.body)) : null;
      return { ok: true, json: async () => syncResult };
    }
    return { ok: false, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return { fetchMock, getSyncBody: () => syncBody };
}

beforeEach(() => localStorage.clear());
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
