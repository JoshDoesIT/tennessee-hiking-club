import { describe, it, expect } from "vitest";
import { evaluateChallenge, CHALLENGES, type Challenge } from "./challenges";
import type { Trail } from "@/lib/trails/schema";

const make = (over: Partial<Trail>): Trail => ({
  slug: "x",
  name: "X",
  region: "East",
  area: "A",
  coordinates: { lat: 35.6, lng: -83.4 },
  lengthMiles: 5,
  elevationGainFt: 1000,
  difficulty: "moderate",
  routeType: "loop",
  tags: [],
  photos: [],
  summary: "s",
  body: "",
  ...over,
});

const trails: Trail[] = [
  make({ slug: "a", region: "East", tags: ["summit"] }),
  make({ slug: "b", region: "Middle", tags: ["waterfall"] }),
  make({ slug: "c", region: "West" }),
  make({ slug: "d", region: "East", tags: ["waterfall"] }),
  make({ slug: "e", region: "Middle", tags: ["waterfall"] }),
];

const challenge = (criterion: Challenge["criterion"]): Challenge => ({
  slug: "test",
  name: "Test",
  description: "",
  criterion,
});

describe("evaluateChallenge", () => {
  it("allRegions: done only when all three Grand Divisions are hiked", () => {
    const c = challenge({ kind: "allRegions" });
    expect(evaluateChallenge(c, ["a", "b"], trails)).toMatchObject({
      progress: 2,
      total: 3,
      done: false,
    });
    expect(evaluateChallenge(c, ["a", "b", "c"], trails).done).toBe(true);
  });

  it("trails: requires a specific set", () => {
    const c = challenge({ kind: "trails", slugs: ["a", "d"] });
    expect(evaluateChallenge(c, ["a"], trails)).toMatchObject({
      progress: 1,
      total: 2,
      done: false,
    });
    expect(evaluateChallenge(c, ["a", "d"], trails).done).toBe(true);
  });

  it("tagCount: N trails with a tag, capped at N", () => {
    const c = challenge({ kind: "tagCount", tag: "waterfall", count: 2 });
    expect(evaluateChallenge(c, ["b"], trails)).toMatchObject({
      progress: 1,
      total: 2,
      done: false,
    });
    expect(evaluateChallenge(c, ["b", "d", "e"], trails)).toMatchObject({
      progress: 2,
      total: 2,
      done: true,
    });
  });

  it("count: N distinct trails (repeats do not count twice)", () => {
    const c = challenge({ kind: "count", count: 3 });
    expect(evaluateChallenge(c, ["a", "a", "b"], trails)).toMatchObject({
      progress: 2,
      total: 3,
      done: false,
    });
    expect(evaluateChallenge(c, ["a", "b", "c"], trails).done).toBe(true);
  });

  it("ships a seed set of Tennessee challenges including one across all regions", () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(3);
    expect(CHALLENGES.some((c) => c.criterion.kind === "allRegions")).toBe(
      true,
    );
  });
});
