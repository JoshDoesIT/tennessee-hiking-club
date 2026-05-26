import { describe, it, expect } from "vitest";
import { filterTrails, parseTrailFilters } from "./filter";
import type { Trail } from "./schema";

const make = (over: Partial<Trail>): Trail => ({
  slug: "x",
  name: "X",
  region: "East",
  area: "A",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 6,
  elevationGainFt: 100,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  ...over,
});

const trails: Trail[] = [
  make({ slug: "a", region: "East", difficulty: "easy", lengthMiles: 3 }),
  make({ slug: "b", region: "Middle", difficulty: "hard", lengthMiles: 8 }),
  make({ slug: "c", region: "West", difficulty: "moderate", lengthMiles: 12 }),
  make({ slug: "d", region: "East", difficulty: "hard", lengthMiles: 5 }),
];

const slugs = (ts: Trail[]) => ts.map((t) => t.slug);

describe("filterTrails", () => {
  it("returns every trail when no filters are set", () => {
    expect(filterTrails(trails, {})).toHaveLength(4);
  });

  it("filters by region", () => {
    expect(slugs(filterTrails(trails, { region: "East" }))).toEqual(["a", "d"]);
  });

  it("filters by difficulty", () => {
    expect(slugs(filterTrails(trails, { difficulty: "hard" }))).toEqual([
      "b",
      "d",
    ]);
  });

  it("filters by length bucket", () => {
    expect(slugs(filterTrails(trails, { length: "short" }))).toEqual(["a"]);
    expect(slugs(filterTrails(trails, { length: "medium" }))).toEqual([
      "b",
      "d",
    ]);
    expect(slugs(filterTrails(trails, { length: "long" }))).toEqual(["c"]);
  });

  it("combines filters with AND", () => {
    expect(
      slugs(filterTrails(trails, { region: "East", difficulty: "hard" })),
    ).toEqual(["d"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(
      filterTrails(trails, { region: "West", difficulty: "easy" }),
    ).toEqual([]);
  });
});

describe("parseTrailFilters", () => {
  it("keeps valid params and drops invalid ones", () => {
    expect(
      parseTrailFilters({
        region: "East",
        difficulty: "nope",
        length: "short",
      }),
    ).toEqual({ region: "East", length: "short" });
  });

  it("ignores unknown length buckets", () => {
    expect(parseTrailFilters({ length: "huge" }).length).toBeUndefined();
  });

  it("takes the first value when a param repeats", () => {
    expect(parseTrailFilters({ region: ["East", "West"] }).region).toBe("East");
  });
});
