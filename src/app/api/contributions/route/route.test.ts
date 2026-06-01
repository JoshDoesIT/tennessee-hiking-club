// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getTrailBySlug: vi.fn(),
  values: vi.fn(() => ({ returning: async () => [{ id: "r1" }] })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/trails", () => ({ getTrailBySlug: mocks.getTrailBySlug }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({ insert: () => ({ values: mocks.values }) }),
}));

import { POST } from "./route";

const GPX =
  `<?xml version="1.0"?><gpx><trk><name>My hike</name><trkseg>` +
  `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele></trkpt>` +
  `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele></trkpt>` +
  `</trkseg></trk></gpx>`;

function routeReq(gpx: string | null = GPX, trailSlug = "grotto-falls") {
  const form = new FormData();
  form.set("trailSlug", trailSlug);
  if (gpx !== null) {
    form.set("gpx", new Blob([gpx], { type: "application/gpx+xml" }), "hike.gpx");
  }
  return new Request("http://localhost/api/contributions/route", {
    method: "POST",
    body: form,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.getTrailBySlug.mockReturnValue({ slug: "grotto-falls" });
  process.env.DATABASE_URL = "postgres://test";
});

describe("POST /api/contributions/route", () => {
  it("returns 401 when not signed in and never inserts", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(routeReq());
    expect(res.status).toBe(401);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trail and never inserts", async () => {
    mocks.getTrailBySlug.mockReturnValue(null);
    const res = await POST(routeReq());
    expect(res.status).toBe(404);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 when no GPX file is attached", async () => {
    const res = await POST(routeReq(null));
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns 400 when the GPX has no usable track", async () => {
    const res = await POST(routeReq("<gpx></gpx>"));
    expect(res.status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("records a pending route submission with its stats and points", async () => {
    const res = await POST(routeReq());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "r1" });

    const row = (mocks.values as Mock).mock.calls[0][0];
    expect(row).toMatchObject({
      userId: "u1",
      trailSlug: "grotto-falls",
      name: "My hike",
      pointCount: 2,
    });
    expect(row.gainFt).toBeGreaterThan(0);
    expect(row.lengthMiles).toBeGreaterThan(0);

    const stored = JSON.parse(row.route);
    expect(stored).toHaveLength(2);
    expect(stored[0]).toMatchObject({ lat: 35.6, lng: -83.45 });
  });
});
