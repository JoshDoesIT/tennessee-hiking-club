/**
 * Minimal GitHub REST client for opening content pull requests (#155). Used to
 * automate publishing an approved in-app submission: the app commits the change
 * on a branch and opens a PR, so a maintainer only has to merge it and CI still
 * validates. Gated by `GITHUB_CONTENT_TOKEN`; absent that, callers fall back to
 * the manual download/paste flow.
 */
export type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
};

export function githubConfigFromEnv(): GithubConfig | null {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) return null;
  const repo =
    process.env.GITHUB_CONTENT_REPO || "JoshDoesIT/tennessee-hiking-club";
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;
  return {
    token,
    owner,
    repo: name,
    baseBranch: process.env.GITHUB_CONTENT_BASE || "main",
  };
}

export interface GithubApi {
  getBranchSha(branch: string): Promise<string>;
  createBranch(branch: string, sha: string): Promise<void>;
  getFile(
    path: string,
    ref: string,
  ): Promise<{ content: string; sha: string } | null>;
  putFile(args: {
    path: string;
    content: string;
    message: string;
    branch: string;
    sha?: string;
  }): Promise<void>;
  /** Commit a binary file from already-base64-encoded bytes (e.g. an image). */
  putBinaryFile(args: {
    path: string;
    base64: string;
    message: string;
    branch: string;
    sha?: string;
  }): Promise<void>;
  openPullRequest(args: {
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<{ url: string }>;
}

const API = "https://api.github.com";

export function createGithubApi(config: GithubConfig): GithubApi {
  const base = `${API}/repos/${config.owner}/${config.repo}`;
  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function gh(path: string, init?: RequestInit) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(
        `GitHub ${init?.method ?? "GET"} ${path} failed: ${res.status}`,
      );
    }
    return res.json();
  }

  return {
    async getBranchSha(branch) {
      const data = await gh(`/git/ref/heads/${branch}`);
      return data.object.sha as string;
    },
    async createBranch(branch, sha) {
      await gh(`/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
      });
    },
    async getFile(path, ref) {
      try {
        const data = await gh(
          `/contents/${path}?ref=${encodeURIComponent(ref)}`,
        );
        const content = Buffer.from(data.content, "base64").toString("utf8");
        return { content, sha: data.sha as string };
      } catch {
        return null;
      }
    },
    async putFile({ path, content, message, branch, sha }) {
      await gh(`/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
    },
    async putBinaryFile({ path, base64, message, branch, sha }) {
      await gh(`/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: base64,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
    },
    async openPullRequest({ title, body, head, base: prBase }) {
      const data = await gh(`/pulls`, {
        method: "POST",
        body: JSON.stringify({ title, body, head, base: prBase }),
      });
      return { url: data.html_url as string };
    },
  };
}

/**
 * Branch from `base`, commit a single file, and open a PR. Works for both a new
 * file (omit `sha`) and an update to an existing one (pass its blob `sha`).
 */
export async function openFilePullRequest(
  api: GithubApi,
  args: {
    base: string;
    branch: string;
    path: string;
    content: string;
    message: string;
    title: string;
    body: string;
    sha?: string;
  },
): Promise<{ url: string }> {
  const baseSha = await api.getBranchSha(args.base);
  await api.createBranch(args.branch, baseSha);
  await api.putFile({
    path: args.path,
    content: args.content,
    message: args.message,
    branch: args.branch,
    sha: args.sha,
  });
  return api.openPullRequest({
    title: args.title,
    body: args.body,
    head: args.branch,
    base: args.base,
  });
}
