import { describe, it, expect } from "vitest";
import {
  evaluateChallenge,
  CHALLENGES,
  challengeSchema,
  type Challenge,
} from "./challenges";
import type { Trail } from "@/lib/trails/schema";
import { getAllTrails } from "@/lib/trails";

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
  alerts: [],
  conditionReports: [],
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

describe("CHALLENGES seed against the real catalog", () => {
  const catalog = getAllTrails();
  const allSlugs = catalog.map((t) => t.slug);

  it("ships the themed and seasonal challenges", () => {
    const slugs = CHALLENGES.map((c) => c.slug);
    for (const expected of [
      "cross-the-state",
      "tennessee-waterfaller",
      "grassy-balds",
      "state-parks-passport",
      "roan-rhododendron",
      "reelfoot-eagles",
      "fall-color-tour",
    ]) {
      expect(slugs, `missing challenge "${expected}"`).toContain(expected);
    }
  });

  it("every challenge is completable by hiking the whole catalog", () => {
    for (const c of CHALLENGES) {
      const { done, progress, total } = evaluateChallenge(c, allSlugs, catalog);
      expect(
        done,
        `"${c.slug}" is not completable with the current catalog (${progress}/${total})`,
      ).toBe(true);
    }
  });

  it("has no challenge that references a trail slug missing from the catalog", () => {
    const known = new Set(allSlugs);
    for (const c of CHALLENGES) {
      if (c.criterion.kind !== "trails") continue;
      for (const slug of c.criterion.slugs) {
        expect(known, `"${c.slug}" references unknown trail "${slug}"`).toContain(
          slug,
        );
      }
    }
  });

  it("seasonal challenges declare their season", () => {
    for (const slug of [
      "roan-rhododendron",
      "reelfoot-eagles",
      "fall-color-tour",
    ]) {
      const c = CHALLENGES.find((x) => x.slug === slug);
      expect(c?.season, `"${slug}" needs a season`).toBeTruthy();
    }
  });
});

describe("challengeSchema", () => {
  it("validates the shipped challenge set", () => {
    expect(() => challengeSchema.array().parse(CHALLENGES)).not.toThrow();
  });

  it("rejects an unknown criterion kind", () => {
    const bad = {
      slug: "bad",
      name: "Bad",
      description: "d",
      criterion: { kind: "nope" },
    };
    expect(challengeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a tagCount criterion with a non-positive count", () => {
    const bad = {
      slug: "bad",
      name: "Bad",
      description: "d",
      criterion: { kind: "tagCount", tag: "x", count: 0 },
    };
    expect(challengeSchema.safeParse(bad).success).toBe(false);
  });
});
