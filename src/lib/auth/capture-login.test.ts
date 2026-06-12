import { describe, it, expect } from "vitest";
import { captureGithubLogin } from "./capture-login";

function fakeDb() {
  const calls: { values?: unknown; set?: unknown }[] = [];
  const db = {
    insert: () => ({
      values: (values: unknown) => ({
        onConflictDoUpdate: ({ set }: { set: unknown }) => {
          calls.push({ values, set });
          return Promise.resolve();
        },
      }),
    }),
  };
  return { db: db as never, calls };
}

describe("captureGithubLogin", () => {
  it("upserts the github login for a github sign-in", async () => {
    const { db, calls } = fakeDb();
    await captureGithubLogin(
      {
        user: { id: "u1" },
        account: { provider: "github" },
        profile: { login: "Octocat" },
      },
      db,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].values).toMatchObject({
      userId: "u1",
      githubLogin: "Octocat",
    });
    expect(calls[0].set).toMatchObject({ githubLogin: "Octocat" });
  });

  it("no-ops for a non-github provider", async () => {
    const { db, calls } = fakeDb();
    await captureGithubLogin(
      {
        user: { id: "u1" },
        account: { provider: "google" },
        profile: { login: "x" },
      },
      db,
    );
    expect(calls).toHaveLength(0);
  });

  it("no-ops when the github login is missing or not a string", async () => {
    const { db, calls } = fakeDb();
    await captureGithubLogin(
      { user: { id: "u1" }, account: { provider: "github" }, profile: {} },
      db,
    );
    expect(calls).toHaveLength(0);
  });

  it("no-ops without a user id", async () => {
    const { db, calls } = fakeDb();
    await captureGithubLogin(
      { user: {}, account: { provider: "github" }, profile: { login: "x" } },
      db,
    );
    expect(calls).toHaveLength(0);
  });
});
