import { describe, it, expect } from "vitest";
import {
  networkRoute,
  networkLoop,
  proximityRoute,
  proximityLoop,
} from "./route-network";

// A small network shaped like:  A - B - C - D
//                                           \ E
// (deltas of 0.001 deg ~= 111 m so every vertex is a distinct node)
const net = {
  elements: [
    {
      type: "way",
      geometry: [
        { lat: 0, lon: 0 }, // A
        { lat: 0, lon: 0.001 }, // B
        { lat: 0, lon: 0.002 }, // C
      ],
    },
    {
      type: "way",
      geometry: [
        { lat: 0, lon: 0.002 },
        { lat: 0.001, lon: 0.002 },
      ],
    }, // C-D
    {
      type: "way",
      geometry: [
        { lat: 0, lon: 0.002 },
        { lat: 0, lon: 0.003 },
      ],
    }, // C-E
  ],
};

describe("networkRoute", () => {
  it("routes from the node nearest start to the node nearest end through shared junctions", () => {
    const path = networkRoute(
      net,
      { lat: 0, lng: 0.0001 }, // near A
      { lat: 0.0009, lng: 0.002 }, // near D
    );
    expect(path).toEqual([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.001 },
      { lat: 0, lng: 0.002 },
      { lat: 0.001, lng: 0.002 },
    ]);
  });

  it("takes the branch toward a different destination", () => {
    const path = networkRoute(net, { lat: 0, lng: 0 }, { lat: 0, lng: 0.0029 });
    expect(path[path.length - 1]).toEqual({ lat: 0, lng: 0.003 }); // E
  });

  it("returns an empty path when start and end are in disconnected components", () => {
    const disconnected = {
      elements: [
        {
          type: "way",
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 0.001 },
          ],
        },
        {
          type: "way",
          geometry: [
            { lat: 5, lon: 5 },
            { lat: 5, lon: 5.001 },
          ],
        },
      ],
    };
    expect(
      networkRoute(disconnected, { lat: 0, lng: 0 }, { lat: 5, lng: 5 }),
    ).toEqual([]);
  });

  it("returns an empty path when there are no ways", () => {
    expect(
      networkRoute({ elements: [] }, { lat: 0, lng: 0 }, { lat: 1, lng: 1 }),
    ).toEqual([]);
  });

  it("bridges a small gap between ways when a snap distance is given", () => {
    // Two ways that nearly meet: B is at (0, 0.001), B' at (0, 0.0011) ~ 11 m away.
    const gappy = {
      elements: [
        {
          type: "way",
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0, lon: 0.001 },
          ],
        },
        {
          type: "way",
          geometry: [
            { lat: 0, lon: 0.0011 },
            { lat: 0, lon: 0.002 },
          ],
        },
      ],
    };
    // Exact keying leaves them disconnected.
    expect(
      networkRoute(gappy, { lat: 0, lng: 0 }, { lat: 0, lng: 0.002 }),
    ).toEqual([]);
    // A 25 m snap merges B and B', so the path connects end to end.
    const path = networkRoute(
      gappy,
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.002 },
      25,
    );
    expect(path.length).toBeGreaterThanOrEqual(3);
    expect(path[0]).toEqual({ lat: 0, lng: 0 });
    expect(path[path.length - 1]).toEqual({ lat: 0, lng: 0.002 });
  });
});

describe("networkLoop", () => {
  // A square: A-B-C-D-A (so there are two edge-disjoint ways around it).
  const A = { lat: 0, lon: 0 };
  const B = { lat: 0, lon: 0.001 };
  const C = { lat: 0.001, lon: 0.001 };
  const D = { lat: 0.001, lon: 0 };
  const square = {
    elements: [
      { type: "way", geometry: [A, B] },
      { type: "way", geometry: [B, C] },
      { type: "way", geometry: [C, D] },
      { type: "way", geometry: [D, A] },
    ],
  };

  it("returns a closed loop from the trailhead out to a via point and back a different way", () => {
    const loop = networkLoop(
      square,
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.001 },
    );
    // Starts and ends at the trailhead.
    expect(loop[0]).toEqual({ lat: 0, lng: 0 });
    expect(loop[loop.length - 1]).toEqual({ lat: 0, lng: 0 });
    // Visits the via point and all four corners (out one side, back the other).
    const keys = new Set(loop.map((p) => `${p.lat},${p.lng}`));
    expect(keys).toContain("0.001,0.001"); // C (via)
    expect(keys).toContain("0,0.001"); // B
    expect(keys).toContain("0.001,0"); // D
    expect(loop.length).toBe(5); // A,B,C,D,A
  });

  it("falls back to an out-and-back when no disjoint return exists", () => {
    // A simple spur A-B-C: there is no second way back.
    const spur = {
      elements: [{ type: "way", geometry: [A, B, C] }],
    };
    const loop = networkLoop(
      spur,
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.001 },
    );
    expect(loop[0]).toEqual({ lat: 0, lng: 0 });
    expect(loop[loop.length - 1]).toEqual({ lat: 0, lng: 0 });
  });
});

describe("proximityRoute", () => {
  // An unordered cloud of points roughly along a corridor (no edges given).
  const cloud = [
    { lat: 0, lng: 0.002 },
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.004 },
    { lat: 0.00002, lng: 0.001 }, // slight GPS noise off the line
    { lat: 0, lng: 0.003 },
    { lat: 5, lng: 5 }, // an unrelated stray point far away
  ];

  it("routes through a point cloud by connecting points within the snap distance", () => {
    const path = proximityRoute(
      cloud,
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.004 },
      200, // ~200 m bridges the ~111 m point spacing
    );
    expect(path[0]).toEqual({ lat: 0, lng: 0 });
    expect(path[path.length - 1]).toEqual({ lat: 0, lng: 0.004 });
    expect(path.length).toBeGreaterThanOrEqual(4); // walks the corridor, not the stray
    expect(path).not.toContainEqual({ lat: 5, lng: 5 });
  });

  it("returns an empty path when the cloud is too sparse to connect", () => {
    const path = proximityRoute(
      cloud,
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.004 },
      10,
    );
    expect(path).toEqual([]);
  });
});

describe("proximityLoop", () => {
  // A square loop of trace points (corners), each side traced.
  const ring = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.001 },
    { lat: 0.001, lng: 0.001 },
    { lat: 0.001, lng: 0 },
  ];

  it("loops through a point cloud out one side and back the other", () => {
    const loop = proximityLoop(
      ring,
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.001 },
      130, // bridges the 111 m sides but not the 157 m diagonals
    );
    expect(loop[0]).toEqual({ lat: 0, lng: 0 });
    expect(loop[loop.length - 1]).toEqual({ lat: 0, lng: 0 });
    const keys = new Set(loop.map((p) => `${p.lat},${p.lng}`));
    expect(keys.size).toBe(4); // visits all four corners
  });
});
