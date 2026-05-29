// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  profileRows: [] as Array<{ githubLogin: string | null }>,
  trails: [] as unknown[],
  approvedCount: 0,
  conditionCount: 0,
  photoCount: 0,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => mocks.profileRows }) }),
    }),
  }),
}));
vi.mock("@/lib/trails", () => ({ getAllTrails: () => mocks.trails }));
vi.mock("@/lib/contributions/submissions-server", () => ({
  getApprovedSubmissionCount: async () => mocks.approvedCount,
}));
vi.mock("@/lib/contributions/conditions-server", () => ({
  getApprovedConditionCount: async () => mocks.conditionCount,
}));
vi.mock("@/lib/contributions/photos-server", () => ({
  getApprovedPhotoCount: async () => mocks.photoCount,
}));

import { getContributionCountForUser } from "./contributions-server";

const trailBy = (login: string) => ({
  slug: "a",
  contributors: [login],
  conditionReports: [],
  photos: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  mocks.profileRows = [];
  mocks.trails = [];
  mocks.approvedCount = 0;
  mocks.conditionCount = 0;
  mocks.photoCount = 0;
});

describe("getContributionCountForUser", () => {
  it("adds approved in-app submissions to content-attributed contributions", async () => {
    mocks.profileRows = [{ githubLogin: "octocat" }];
    mocks.trails = [trailBy("octocat")];
    mocks.approvedCount = 2;
    expect(await getContributionCountForUser("u1")).toBe(3);
  });

  it("recognizes an in-app contributor who has no GitHub login", async () => {
    mocks.profileRows = [{ githubLogin: null }];
    mocks.trails = [];
    mocks.approvedCount = 1;
    expect(await getContributionCountForUser("u1")).toBe(1);
  });

  it("adds approved in-app condition reports to the badge total", async () => {
    mocks.profileRows = [{ githubLogin: null }];
    mocks.trails = [];
    mocks.approvedCount = 1;
    mocks.conditionCount = 2;
    expect(await getContributionCountForUser("u1")).toBe(3);
  });

  it("adds approved in-app photos to the badge total", async () => {
    mocks.profileRows = [{ githubLogin: null }];
    mocks.trails = [];
    mocks.photoCount = 2;
    expect(await getContributionCountForUser("u1")).toBe(2);
  });

  it("returns 0 when there is no database", async () => {
    delete process.env.DATABASE_URL;
    expect(await getContributionCountForUser("u1")).toBe(0);
  });
});
