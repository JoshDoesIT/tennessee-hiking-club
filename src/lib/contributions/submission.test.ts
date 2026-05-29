import { describe, it, expect } from "vitest";
import { validateTrailSubmission } from "./submission";

const valid = {
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls State Natural Area",
  lat: 35.7277,
  lng: -84.8556,
  description: "A short loop to a walk-behind waterfall.",
};

describe("validateTrailSubmission", () => {
  it("accepts a complete, in-Tennessee submission", () => {
    expect(validateTrailSubmission(valid).success).toBe(true);
  });

  it("accepts optional length, gain, difficulty, route type, and links", () => {
    expect(
      validateTrailSubmission({
        ...valid,
        lengthMiles: 1.8,
        elevationGainFt: 350,
        difficulty: "moderate",
        routeType: "loop",
        links: "https://example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects a missing required field", () => {
    const incomplete = { ...valid } as Partial<typeof valid>;
    delete incomplete.name;
    expect(validateTrailSubmission(incomplete).success).toBe(false);
  });

  it("rejects coordinates outside Tennessee", () => {
    expect(
      validateTrailSubmission({ ...valid, lat: 33.7, lng: -84.4 }).success,
    ).toBe(false);
  });

  it("rejects an unknown region or difficulty", () => {
    expect(validateTrailSubmission({ ...valid, region: "North" }).success).toBe(
      false,
    );
    expect(
      validateTrailSubmission({ ...valid, difficulty: "deadly" }).success,
    ).toBe(false);
  });
});
