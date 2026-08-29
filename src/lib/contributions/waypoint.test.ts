import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { validateWaypointSubmission, generateWaypointEntry } from "./waypoint";

describe("validateWaypointSubmission", () => {
  const valid = {
    trailSlug: "virgin-falls",
    lat: 35.83,
    lng: -85.29,
    name: "Big Branch Falls",
    type: "waterfall",
  };

  it("accepts a valid suggestion, with an optional description", () => {
    expect(validateWaypointSubmission(valid).success).toBe(true);
    expect(
      validateWaypointSubmission({ ...valid, description: "110-ft drop" })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(
      validateWaypointSubmission({ ...valid, type: "dragon" }).success,
    ).toBe(false);
  });

  it("rejects coordinates outside Tennessee", () => {
    expect(
      validateWaypointSubmission({ ...valid, lat: 40, lng: -100 }).success,
    ).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(validateWaypointSubmission({ ...valid, name: "" }).success).toBe(
      false,
    );
    const noLat: Record<string, unknown> = { ...valid };
    delete noLat.lat;
    expect(validateWaypointSubmission(noLat).success).toBe(false);
    const noSlug: Record<string, unknown> = { ...valid };
    delete noSlug.trailSlug;
    expect(validateWaypointSubmission(noSlug).success).toBe(false);
  });
});

describe("generateWaypointEntry", () => {
  it("produces a waypoints[] entry that round-trips through the trail schema", () => {
    const entry = generateWaypointEntry({
      lat: 35.83,
      lng: -85.29,
      name: "Big Branch Falls",
      type: "waterfall",
      description: "110-ft drop",
    });
    expect(entry.valid).toBe(true);

    const doc = matter(`---\nwaypoints:\n${entry.yaml}\n---\n`);
    expect(doc.data.waypoints[0]).toMatchObject({
      lat: 35.83,
      lng: -85.29,
      name: "Big Branch Falls",
      type: "waterfall",
      description: "110-ft drop",
    });
  });

  it("omits an absent description", () => {
    const entry = generateWaypointEntry({
      lat: 35.83,
      lng: -85.29,
      name: "The Overlook",
      type: "viewpoint",
    });
    expect(entry.yaml).not.toContain("description:");
    expect(entry.valid).toBe(true);
  });

  it("credits the submitter with a comment without breaking validation", () => {
    const entry = generateWaypointEntry({
      lat: 35.83,
      lng: -85.29,
      name: "The Overlook",
      type: "viewpoint",
      by: "trail-ann",
    });
    expect(entry.yaml).toContain("# suggested by trail-ann");
    expect(entry.valid).toBe(true);
    // The comment is ignored by YAML, so the parsed object is still clean.
    const doc = matter(`---\nwaypoints:\n${entry.yaml}\n---\n`);
    expect(doc.data.waypoints[0]).toMatchObject({ name: "The Overlook" });
  });
});
