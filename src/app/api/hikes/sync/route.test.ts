// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  values: vi.fn(async () => undefined),
  where: vi.fn(async () => [] as unknown[]),
  deleteTable: vi.fn(),
  del: vi.fn(async () => undefined),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: mocks.where }) }),
    insert: () => ({ values: mocks.values }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    delete: (t: unknown) => {
      mocks.deleteTable(t);
      return { where: mocks.del };
    },
  }),
}));

import { POST, DELETE } from "./route";

const points = [
  { lat: 35.6, lng: -83.45, elevationFt: 1000 },
  { lat: 35.62, lng: -83.44, elevationFt: 1200 },
];

function syncReq(hikes: unknown[]) {
  return new Request("http://localhost/api/hikes/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hikes }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.where.mockResolvedValue([]);
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/hikes/sync", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(
      syncReq([{ trailSlug: "a", hikedOn: "2026-01-01" }]),
    );
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("persists a hike's recorded track and duration", async () => {
    const res = await POST(
      syncReq([
        {
          trailSlug: "grotto-falls",
          hikedOn: "2026-05-30",
          track: { points, durationMin: 90 },
        },
      ]),
    );
    expect(res.status).toBe(200);
    const inserted = (mocks.values as Mock).mock.calls[0][0] as Array<{
      route: string | null;
      trackDurationMin: number | null;
    }>;
    expect(JSON.parse(inserted[0].route as string)).toEqual(points);
    expect(inserted[0].trackDurationMin).toBe(90);
  });

  it("returns the merged log carrying the track back to the client", async () => {
    const res = await POST(
      syncReq([
        {
          trailSlug: "grotto-falls",
          hikedOn: "2026-05-30",
          track: { points, durationMin: 90 },
        },
      ]),
    );
    const data = await res.json();
    expect(data.hikes[0].track).toEqual({ points, durationMin: 90 });
  });
});

function delReq(body: unknown) {
  return new Request("http://localhost/api/hikes/sync", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/hikes/sync", () => {
  it("returns 401 when not signed in and never deletes", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await DELETE(delReq({ trailSlug: "a", hikedOn: "2026-01-01" }));
    expect(res.status).toBe(401);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("returns 400 without both a trail and a date", async () => {
    const res = await DELETE(delReq({ trailSlug: "a" }));
    expect(res.status).toBe(400);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("deletes the matching hike for the signed-in user", async () => {
    const res = await DELETE(delReq({ trailSlug: "a", hikedOn: "2026-01-01" }));
    expect(res.status).toBe(200);
    expect(mocks.deleteTable).toHaveBeenCalled();
    expect(mocks.del).toHaveBeenCalled();
  });
});
