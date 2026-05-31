import { describe, it, expect } from "vitest";
import { sampleElevationFeet } from "./dem";

// A stand-in for the OpenTopoData response, so the test never hits the network.
function fakeFetch(payload: unknown) {
  return async () => ({ json: async () => payload });
}

describe("sampleElevationFeet", () => {
  it("returns elevation in feet for each point (meters -> feet)", async () => {
    const out = await sampleElevationFeet(
      [
        { lat: 35.6, lng: -83.4 },
        { lat: 35.7, lng: -83.5 },
      ],
      fakeFetch({
        status: "OK",
        results: [{ elevation: 1000 }, { elevation: 2000 }],
      }),
    );
    expect(out[0]).toBe(3281); // 1000 m, rounded to whole feet
    expect(out[1]).toBe(6562); // 2000 m
  });

  it("returns null for a point the DEM cannot resolve", async () => {
    const out = await sampleElevationFeet(
      [{ lat: 0, lng: 0 }],
      fakeFetch({ status: "OK", results: [{ elevation: null }] }),
    );
    expect(out).toEqual([null]);
  });

  it("returns nulls (no throw) when the API reports a failure", async () => {
    const out = await sampleElevationFeet(
      [{ lat: 1, lng: 1 }],
      fakeFetch({ status: "INVALID_REQUEST", error: "bad" }),
    );
    expect(out).toEqual([null]);
  });

  it("returns nulls (no throw) when the fetch itself rejects", async () => {
    const out = await sampleElevationFeet([{ lat: 1, lng: 1 }], async () => {
      throw new Error("network down");
    });
    expect(out).toEqual([null]);
  });
});
