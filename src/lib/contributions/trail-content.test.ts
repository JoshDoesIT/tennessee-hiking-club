import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { slugify, uniqueSlug, generateTrailContent } from "./trail-content";
import { trailSchema } from "@/lib/trails/schema";

const complete = {
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls State Natural Area",
  lat: 35.7277,
  lng: -84.8556,
  description: "A short loop to a walk-behind waterfall.",
  lengthMiles: 1.8,
  elevationGainFt: 350,
  difficulty: "moderate",
  routeType: "loop",
  submitterHandle: "trail-ann",
};

describe("slugify", () => {
  it("kebab-cases a name and drops apostrophes and punctuation", () => {
    expect(slugify("Piney Falls")).toBe("piney-falls");
    expect(slugify("Charlie's Bunion")).toBe("charlies-bunion");
    expect(slugify("  Mount  LeConte (East) ")).toBe("mount-leconte-east");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", () => {
    expect(uniqueSlug("Piney Falls", [])).toBe("piney-falls");
  });

  it("suffixes a number when the slug already exists", () => {
    expect(uniqueSlug("Piney Falls", ["piney-falls"])).toBe("piney-falls-2");
    expect(uniqueSlug("Piney Falls", ["piney-falls", "piney-falls-2"])).toBe(
      "piney-falls-3",
    );
  });
});

describe("generateTrailContent", () => {
  it("produces a file whose front-matter validates against the trail schema", () => {
    const file = generateTrailContent(complete, []);
    expect(file.valid).toBe(true);
    expect(file.fileName).toBe("piney-falls.md");

    const { data, content } = matter(file.markdown);
    const parsed = trailSchema.safeParse({ ...data, body: content.trim() });
    expect(parsed.success).toBe(true);
  });

  it("credits the submitter in contributors[]", () => {
    const file = generateTrailContent(complete, []);
    const { data } = matter(file.markdown);
    expect(data.contributors).toContain("trail-ann");
  });

  it("dedupes the slug against existing trails", () => {
    const file = generateTrailContent(complete, ["piney-falls"]);
    expect(file.slug).toBe("piney-falls-2");
    expect(file.fileName).toBe("piney-falls-2.md");
  });

  it("reports missing required fields instead of emitting an invalid file as valid", () => {
    const partial = {
      name: complete.name,
      region: complete.region,
      area: complete.area,
      lat: complete.lat,
      lng: complete.lng,
      description: complete.description,
      lengthMiles: complete.lengthMiles,
      elevationGainFt: complete.elevationGainFt,
      submitterHandle: complete.submitterHandle,
    };
    const file = generateTrailContent(partial, []);
    expect(file.valid).toBe(false);
    expect(file.missing).toEqual(
      expect.arrayContaining(["difficulty", "routeType"]),
    );
  });
});
