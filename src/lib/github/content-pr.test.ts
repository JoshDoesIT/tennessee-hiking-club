// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  githubConfigFromEnv,
  openFilePullRequest,
  createGithubApi,
  type GithubApi,
} from "./content-pr";

describe("githubConfigFromEnv", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns null when no token is configured", () => {
    delete process.env.GITHUB_CONTENT_TOKEN;
    expect(githubConfigFromEnv()).toBeNull();
  });

  it("defaults the repo and base branch", () => {
    process.env.GITHUB_CONTENT_TOKEN = "tok";
    delete process.env.GITHUB_CONTENT_REPO;
    delete process.env.GITHUB_CONTENT_BASE;
    expect(githubConfigFromEnv()).toMatchObject({
      token: "tok",
      owner: "JoshDoesIT",
      repo: "tennessee-hiking-club",
      baseBranch: "main",
    });
  });

  it("parses an owner/repo override", () => {
    process.env.GITHUB_CONTENT_TOKEN = "tok";
    process.env.GITHUB_CONTENT_REPO = "acme/trails";
    expect(githubConfigFromEnv()).toMatchObject({
      owner: "acme",
      repo: "trails",
    });
  });
});

describe("openFilePullRequest", () => {
  function fakeApi(): GithubApi & { calls: string[] } {
    const calls: string[] = [];
    return {
      calls,
      getBranchSha: vi.fn(async () => {
        calls.push("getBranchSha");
        return "base-sha";
      }),
      createBranch: vi.fn(async () => {
        calls.push("createBranch");
      }),
      getFile: vi.fn(async () => null),
      putFile: vi.fn(async () => {
        calls.push("putFile");
      }),
      openPullRequest: vi.fn(async () => {
        calls.push("openPullRequest");
        return { url: "https://github.com/o/r/pull/7" };
      }),
    };
  }

  it("branches from base, commits the file, and opens a PR", async () => {
    const api = fakeApi();
    const res = await openFilePullRequest(api, {
      base: "main",
      branch: "submission/trail-piney-falls",
      path: "content/trails/piney-falls.md",
      content: "file body",
      message: "add piney falls",
      title: "Add Piney Falls",
      body: "From an in-app submission.",
    });

    expect(res.url).toBe("https://github.com/o/r/pull/7");
    expect(api.calls).toEqual([
      "getBranchSha",
      "createBranch",
      "putFile",
      "openPullRequest",
    ]);
    expect(api.createBranch).toHaveBeenCalledWith(
      "submission/trail-piney-falls",
      "base-sha",
    );
    expect(api.putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "content/trails/piney-falls.md",
        content: "file body",
        branch: "submission/trail-piney-falls",
      }),
    );
    expect(api.openPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        head: "submission/trail-piney-falls",
        base: "main",
      }),
    );
  });
});

describe("createGithubApi", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("calls the GitHub REST API with auth to read a branch head", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ object: { sha: "abc123" } }),
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const api = createGithubApi({
      token: "tok",
      owner: "o",
      repo: "r",
      baseBranch: "main",
    });
    const sha = await api.getBranchSha("main");

    expect(sha).toBe("abc123");
    const [url, init] = (fetchMock.mock.calls[0] ?? []) as unknown as [
      string,
      RequestInit,
    ];
    expect(String(url)).toContain("/repos/o/r/git/ref/heads/main");
    expect(init.headers as Record<string, string>).toMatchObject({
      Authorization: "Bearer tok",
    });
  });
});
