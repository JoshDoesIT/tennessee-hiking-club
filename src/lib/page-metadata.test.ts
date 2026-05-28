import { describe, it, expect } from "vitest";
import { pageMetadata } from "./page-metadata";

describe("pageMetadata", () => {
  it("emits per-page openGraph and twitter title, description, and url", () => {
    const md = pageMetadata({
      title: "Leaderboard",
      description: "A friendly opt-in board.",
      path: "/leaderboard",
    });

    expect(md.title).toBe("Leaderboard");
    expect(md.description).toBe("A friendly opt-in board.");
    expect(md.alternates?.canonical).toBe("/leaderboard");
    expect(md.openGraph?.title).toBe("Leaderboard");
    expect(md.openGraph?.description).toBe("A friendly opt-in board.");
    expect(md.openGraph?.url).toBe("/leaderboard");
    expect(md.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Leaderboard",
      description: "A friendly opt-in board.",
    });
  });

  it("sets robots noindex when requested", () => {
    const md = pageMetadata({
      title: "My hikes",
      description: "...",
      path: "/hikes",
      noindex: true,
    });
    expect(md.robots).toEqual({ index: false });
  });

  it("omits robots when noindex is not requested", () => {
    const md = pageMetadata({
      title: "About",
      description: "...",
      path: "/about",
    });
    expect(md.robots).toBeUndefined();
  });
});
