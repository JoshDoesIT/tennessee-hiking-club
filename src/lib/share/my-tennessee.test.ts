import { describe, it, expect } from "vitest";
import { myTennesseeShareUrl, parseShareSlugs } from "./my-tennessee";
import type { Trail } from "@/lib/trails/schema";

const trails = (slugs: string[]): Trail[] =>
  slugs.map(
    (slug) =>
      ({
        slug,
        name: slug,
        region: "East",
        area: "x",
        coordinates: { lat: 35.6, lng: -83.4 },
        lengthMiles: 1,
        elevationGainFt: 0,
        difficulty: "easy",
        routeType: "loop",
        tags: [],
        photos: [],
        summary: "s",
        body: "",
        alerts: [],
        conditionReports: [],
      }) as Trail,
  );

describe("myTennesseeShareUrl", () => {
  it("joins slugs with commas in a single path segment", () => {
    expect(
      myTennesseeShareUrl(
        ["mt-leconte-alum-cave", "virgin-falls"],
        "https://x.test",
      ),
    ).toBe("https://x.test/share/my-tennessee/mt-leconte-alum-cave,virgin-falls");
  });

  it("returns null when there is nothing to share", () => {
    expect(myTennesseeShareUrl([], "https://x.test")).toBeNull();
    expect(myTennesseeShareUrl(["", "  "], "https://x.test")).toBeNull();
  });

  it("de-duplicates repeated slugs so the URL stays compact", () => {
    expect(myTennesseeShareUrl(["a", "b", "a"], "https://x.test")).toBe(
      "https://x.test/share/my-tennessee/a,b",
    );
  });
});

describe("parseShareSlugs", () => {
  const catalog = trails(["a", "b", "c"]);

  it("keeps known, distinct slugs in order", () => {
    expect(parseShareSlugs("a,c", catalog)).toEqual(["a", "c"]);
    expect(parseShareSlugs("a,a,b", catalog)).toEqual(["a", "b"]);
  });

  it("drops unknown slugs", () => {
    expect(parseShareSlugs("a,ghost,b", catalog)).toEqual(["a", "b"]);
  });

  it("trims whitespace and ignores empty segments", () => {
    expect(parseShareSlugs(" a , , b ", catalog)).toEqual(["a", "b"]);
  });

  it("returns an empty list for an empty input", () => {
    expect(parseShareSlugs("", catalog)).toEqual([]);
  });
});
