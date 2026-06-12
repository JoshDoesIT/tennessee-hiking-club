import { describe, it, expect } from "vitest";
import {
  aggregateContributions,
  contributionCountFor,
} from "./contributions";
import type { Trail } from "./schema";

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

describe("aggregateContributions", () => {
  it("counts trails, reports, and photos per login, case-insensitively", () => {
    const trails = [
      make({
        slug: "a",
        contributors: ["Octocat"],
        conditionReports: [{ date: "2026-05-01", status: "Open", by: "octocat" }],
        photos: [{ src: "/p.jpg", alt: "x", by: "OCTOCAT" }],
      }),
    ];
    const map = aggregateContributions(trails);
    expect(map.get("octocat")).toEqual({
      trailsContributed: 1,
      conditionsReported: 1,
      photoCredits: 1,
      total: 3,
    });
  });

  it("dedupes a login listed twice as a contributor on one trail", () => {
    const map = aggregateContributions([
      make({ slug: "a", contributors: ["mossy", "mossy"] }),
    ]);
    expect(map.get("mossy")?.trailsContributed).toBe(1);
  });

  it("counts each condition report separately", () => {
    const map = aggregateContributions([
      make({
        slug: "a",
        conditionReports: [
          { date: "2026-05-01", status: "Open", by: "ranger" },
          { date: "2026-05-08", status: "Muddy", by: "ranger" },
        ],
      }),
    ]);
    expect(map.get("ranger")?.conditionsReported).toBe(2);
  });

  it("ignores empty and missing attribution", () => {
    expect(aggregateContributions([make({ slug: "a" })]).size).toBe(0);
  });
});

describe("contributionCountFor", () => {
  it("looks up a total case-insensitively, defaulting to 0", () => {
    const map = aggregateContributions([
      make({ slug: "a", contributors: ["octocat"] }),
    ]);
    expect(contributionCountFor(map, "Octocat")).toBe(1);
    expect(contributionCountFor(map, "nobody")).toBe(0);
  });
});
