// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import matter from "gray-matter";

const mocks = vi.hoisted(() => ({
  config: null as unknown,
  api: {
    getBranchSha: vi.fn(async () => "base-sha"),
    createBranch: vi.fn(async () => undefined),
    getFile: vi.fn(async () => ({ content: "", sha: "filesha" })),
    putFile: vi.fn(async () => undefined),
    putBinaryFile: vi.fn(async () => undefined),
    openPullRequest: vi.fn(async () => ({
      url: "https://github.com/o/r/pull/9",
    })),
  },
  openFilePullRequest: vi.fn(async () => ({
    url: "https://github.com/o/r/pull/9",
  })),
  updateSet: vi.fn(() => ({ where: async () => undefined })),
  blobGet: vi.fn(async () => ({
    stream: new Blob(["img-bytes"]).stream(),
    blob: { contentType: "image/jpeg" },
  })),
  // publishOnApproval selects the submission row first, then the profile.
  selectCalls: 0,
  firstRow: null as Record<string, unknown> | null,
  profileRow: null as Record<string, unknown> | null,
  trails: [] as Array<{ slug: string }>,
}));
vi.mock("@vercel/blob", () => ({ get: mocks.blobGet }));
vi.mock("@/lib/github/content-pr", () => ({
  githubConfigFromEnv: () => mocks.config,
  createGithubApi: () => mocks.api,
  openFilePullRequest: mocks.openFilePullRequest,
}));
vi.mock("@/lib/trails", () => ({ getAllTrails: () => mocks.trails }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            mocks.selectCalls += 1;
            if (mocks.selectCalls === 1)
              return mocks.firstRow ? [mocks.firstRow] : [];
            return mocks.profileRow ? [mocks.profileRow] : [];
          },
        }),
      }),
    }),
    update: () => ({ set: mocks.updateSet }),
  }),
}));

import {
  trailPublication,
  conditionPublication,
  publishOnApproval,
} from "./publish";

const trailRow = {
  id: "trail123-abc",
  userId: "u1",
  name: "Piney Falls",
  region: "East",
  area: "Piney Falls SNA",
  lat: 35.7277,
  lng: -84.8556,
  description: "A short loop to a walk-behind waterfall.",
  lengthMiles: 1.8,
  elevationGainFt: 350,
  difficulty: "moderate",
  routeType: "loop",
  links: null,
};

const conditionRow = {
  id: "cond456-xyz",
  userId: "u1",
  trailSlug: "virgin-falls",
  status: "Muddy",
  note: "Slick.",
  reportDate: "2026-05-29",
};

const photoRow = {
  id: "photo78-qrs",
  userId: "u1",
  trailSlug: "virgin-falls",
  blobUrl:
    "https://store.private.blob.vercel-storage.com/contributions/photos/u1/x.jpg",
  alt: "The falls in spring flow",
  credit: "Photo by Trail Ann",
};

describe("trailPublication", () => {
  it("builds a PR payload adding the generated trail file", () => {
    const pub = trailPublication(trailRow, "trail-ann", new Set<string>());
    expect(pub.ok).toBe(true);
    if (!pub.ok) return;
    expect(pub.path).toBe("content/trails/piney-falls.md");
    expect(pub.branch).toContain("piney-falls");
    const { data } = matter(pub.content);
    expect(data.slug).toBe("piney-falls");
    expect(data.contributors).toContain("trail-ann");
  });

  it("refuses to build when required fields are missing", () => {
    const { difficulty: _d, routeType: _r, ...partial } = trailRow;
    void _d;
    void _r;
    const pub = trailPublication(partial, "trail-ann", new Set<string>());
    expect(pub.ok).toBe(false);
  });
});

describe("conditionPublication", () => {
  it("appends the report to the trail file content", () => {
    const file = "---\nslug: virgin-falls\nname: Virgin Falls\n---\n\nBody.";
    const pub = conditionPublication(conditionRow, "trail-ann", file);
    expect(pub.path).toBe("content/trails/virgin-falls.md");
    const { data } = matter(pub.content);
    expect(data.conditionReports[0]).toMatchObject({
      status: "Muddy",
      by: "trail-ann",
    });
  });
});

describe("publishOnApproval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = { token: "t", owner: "o", repo: "r", baseBranch: "main" };
    mocks.selectCalls = 0;
    mocks.firstRow = null;
    mocks.profileRow = {
      userId: "u1",
      githubLogin: "trail-ann",
      displayName: null,
    };
    mocks.trails = [];
    mocks.api.getFile = vi.fn(async () => ({
      content: "---\nslug: virgin-falls\nname: Virgin Falls\n---\n\nBody.",
      sha: "filesha",
    }));
  });

  it("returns null when no token is configured", async () => {
    mocks.config = null;
    expect(
      await publishOnApproval({ type: "trail", id: "trail123-abc" }),
    ).toBeNull();
    expect(mocks.openFilePullRequest).not.toHaveBeenCalled();
  });

  it("opens a PR for an approved trail submission", async () => {
    mocks.firstRow = trailRow;
    const res = await publishOnApproval({ type: "trail", id: "trail123-abc" });
    expect(res).toEqual({ url: "https://github.com/o/r/pull/9" });
    const calls = mocks.openFilePullRequest.mock.calls as unknown as Array<
      [unknown, { path: string; sha?: string }]
    >;
    const args = calls[0]?.[1] ?? { path: "" };
    expect(args.path).toBe("content/trails/piney-falls.md");
    expect(args.sha).toBeUndefined();
    // The submitter has a GitHub login, so the published content will credit
    // them; the submission stops counting via the submission path (#153).
    expect(mocks.updateSet).toHaveBeenCalledWith({ status: "published" });
  });

  it("keeps an in-app-only submitter's submission counting (no github login)", async () => {
    mocks.firstRow = trailRow;
    mocks.profileRow = { userId: "u1", githubLogin: null, displayName: "Anon" };
    await publishOnApproval({ type: "trail", id: "trail123-abc" });
    expect(mocks.updateSet).not.toHaveBeenCalled();
  });

  it("opens a PR for an approved condition report, updating the file", async () => {
    mocks.firstRow = conditionRow;
    const res = await publishOnApproval({
      type: "condition",
      id: "cond456-xyz",
    });
    expect(res).toEqual({ url: "https://github.com/o/r/pull/9" });
    expect(mocks.api.getFile).toHaveBeenCalled();
    const calls = mocks.openFilePullRequest.mock.calls as unknown as Array<
      [unknown, { path: string; sha?: string }]
    >;
    const args = calls[0]?.[1] ?? { path: "" };
    expect(args.path).toBe("content/trails/virgin-falls.md");
    expect(args.sha).toBe("filesha");
    expect(mocks.updateSet).toHaveBeenCalledWith({ reviewStatus: "published" });
  });

  it("opens a PR for an approved photo, committing the image and the entry", async () => {
    mocks.firstRow = photoRow;
    mocks.api.getFile = vi.fn(async () => ({
      content:
        "---\nslug: virgin-falls\nname: Virgin Falls\nphotos: []\n---\n\nBody.",
      sha: "contentsha",
    }));
    const res = await publishOnApproval({ type: "photo", id: "photo78-qrs" });
    expect(res).toEqual({ url: "https://github.com/o/r/pull/9" });

    const binCalls = mocks.api.putBinaryFile.mock.calls as unknown as Array<
      [{ path: string; base64: string }]
    >;
    const binArgs = binCalls[0]?.[0] ?? { path: "", base64: "" };
    expect(binArgs.path).toMatch(/^public\/trails\/contributed\/virgin-falls-/);
    expect(typeof binArgs.base64).toBe("string");

    const txtCalls = mocks.api.putFile.mock.calls as unknown as Array<
      [{ path: string; content: string }]
    >;
    const txtArgs = txtCalls[0]?.[0] ?? { path: "", content: "" };
    expect(txtArgs.path).toBe("content/trails/virgin-falls.md");
    expect(txtArgs.content).toContain("The falls in spring flow");
    expect(mocks.api.openPullRequest).toHaveBeenCalled();
    expect(mocks.updateSet).toHaveBeenCalledWith({ reviewStatus: "published" });
  });
});
