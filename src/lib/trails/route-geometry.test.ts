import { describe, it, expect } from "vitest";
import {
  stitchSegments,
  orientFromStart,
  npsSegments,
  overpassSegments,
  combineNamedSegments,
  clipBetween,
} from "./route-geometry";

const p = (lat: number, lng: number) => ({ lat, lng });

/** A stitched chain is valid in either direction; assert it equals one or the other. */
function expectChain(
  result: { lat: number; lng: number }[],
  forward: typeof result,
) {
  const reverse = [...forward].reverse();
  expect([forward, reverse]).toContainEqual(result);
}

describe("stitchSegments", () => {
  it("returns a single segment unchanged", () => {
    const s = [p(0, 0), p(0, 1)];
    expect(stitchSegments([s])).toEqual(s);
  });

  it("joins two segments that share an endpoint", () => {
    const a = [p(0, 0), p(0, 1)];
    const b = [p(0, 1), p(0, 2)];
    expectChain(stitchSegments([a, b]), [p(0, 0), p(0, 1), p(0, 2)]);
  });

  it("reverses a segment when needed to connect", () => {
    const a = [p(0, 0), p(0, 1)];
    const b = [p(0, 2), p(0, 1)]; // shares (0,1) at its END
    expectChain(stitchSegments([a, b]), [p(0, 0), p(0, 1), p(0, 2)]);
  });

  it("orders three out-of-order segments into one connected chain", () => {
    const mid = [p(0, 1), p(0, 2)];
    const end = [p(0, 2), p(0, 3)];
    const start = [p(0, 0), p(0, 1)];
    expectChain(stitchSegments([mid, end, start]), [
      p(0, 0),
      p(0, 1),
      p(0, 2),
      p(0, 3),
    ]);
  });

  it("tolerates near-equal shared endpoints (sub-meter gaps)", () => {
    const a = [p(0, 0), p(35.6, -83.45)];
    const b = [p(35.60001, -83.45001), p(0, 2)];
    // Connected (the near-equal shared node is merged, so 3 points, not a
    // disconnected 4-point jump).
    expect(stitchSegments([a, b]).length).toBe(3);
  });
});

describe("orientFromStart", () => {
  it("keeps a polyline that already starts near the trailhead", () => {
    const line = [p(35.6, -83.4), p(35.7, -83.5)];
    expect(orientFromStart(line, p(35.6, -83.4))[0]).toEqual(p(35.6, -83.4));
  });

  it("reverses a polyline that ends near the trailhead", () => {
    const line = [p(35.7, -83.5), p(35.6, -83.4)];
    expect(orientFromStart(line, p(35.6, -83.4))[0]).toEqual(p(35.6, -83.4));
  });
});

describe("npsSegments", () => {
  it("reads LineString and MultiLineString features as lat/lng segments", () => {
    const fc = {
      features: [
        {
          geometry: {
            type: "LineString",
            coordinates: [
              [-83.45, 35.6],
              [-83.44, 35.61],
            ],
          },
        },
        {
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [-83.4, 35.5],
                [-83.41, 35.52],
              ],
            ],
          },
        },
      ],
    };
    const segs = npsSegments(fc);
    expect(segs).toHaveLength(2);
    expect(segs[0][0]).toEqual({ lat: 35.6, lng: -83.45 });
    expect(segs[1][0]).toEqual({ lat: 35.5, lng: -83.4 });
  });
});

describe("overpassSegments", () => {
  it("reads way geometry as lat/lng segments", () => {
    const json = {
      elements: [
        {
          type: "way",
          geometry: [
            { lat: 35.6, lon: -83.45 },
            { lat: 35.61, lon: -83.44 },
          ],
        },
        { type: "node", lat: 1, lon: 2 },
      ],
    };
    const segs = overpassSegments(json);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual([
      { lat: 35.6, lng: -83.45 },
      { lat: 35.61, lng: -83.44 },
    ]);
  });
});

describe("combineNamedSegments", () => {
  const groups = [
    { name: "River Trail", segments: [[p(1, 1), p(1, 2)]] },
    { name: "Ridgetop Trail", segments: [[p(1, 2), p(1, 3)]] },
    { name: "Other Spur", segments: [[p(9, 9), p(9, 8)]] },
  ];

  it("collects the segments of the named ways, case-insensitively", () => {
    const segs = combineNamedSegments(groups, [
      "river trail",
      "Ridgetop Trail",
    ]);
    expect(segs).toEqual([
      [p(1, 1), p(1, 2)],
      [p(1, 2), p(1, 3)],
    ]);
  });

  it("ignores names not present and keeps every segment of a multi-segment way", () => {
    const segs = combineNamedSegments(
      [{ name: "Loop", segments: [[p(0, 0)], [p(1, 1)]] }],
      ["loop", "missing"],
    );
    expect(segs).toHaveLength(2);
  });
});

describe("clipBetween", () => {
  // A straight west-east line of points.
  const line = [p(0, 0), p(0, 1), p(0, 2), p(0, 3), p(0, 4)];

  it("returns the slice between the points nearest start and end", () => {
    expect(clipBetween(line, p(0, 1.1), p(0, 3.1))).toEqual([
      p(0, 1),
      p(0, 2),
      p(0, 3),
    ]);
  });

  it("orients the slice to begin at the start point", () => {
    // start is nearer the east end: the result runs east -> west.
    expect(clipBetween(line, p(0, 3.1), p(0, 1.1))).toEqual([
      p(0, 3),
      p(0, 2),
      p(0, 1),
    ]);
  });

  it("clips from a mid-line start (trailhead at a gap) to a destination", () => {
    // start in the middle (index 2), destination near the east end (index 4).
    expect(clipBetween(line, p(0.001, 2), p(0, 3.9))).toEqual([
      p(0, 2),
      p(0, 3),
      p(0, 4),
    ]);
  });
});
