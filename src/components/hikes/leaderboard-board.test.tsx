import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { LeaderboardEntry } from "@/lib/hikes/leaderboard";

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => nav.params }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { LeaderboardBoard } from "./leaderboard-board";

const entry = (user: string, over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  user,
  regions: 0,
  trails: 0,
  challenges: 0,
  contributions: 0,
  trailsContributed: 0,
  conditionsReported: 0,
  photoCredits: 0,
  ...over,
});

function mockApi(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => data }) as unknown as Response),
  );
}

beforeEach(() => {
  nav.params = new URLSearchParams();
});
afterEach(() => vi.unstubAllGlobals());

describe("LeaderboardBoard", () => {
  it("lists the fetched entries ranked by the active metric", async () => {
    mockApi({
      entries: [entry("Ana", { trails: 5 }), entry("Bo", { trails: 9 })],
    });
    render(<LeaderboardBoard />);
    await waitFor(() => expect(screen.getByText("Bo")).toBeInTheDocument());
    const names = screen
      .getAllByRole("listitem")
      .map((li) => li.querySelector("span:nth-child(2)")?.textContent);
    expect(names).toEqual(["Bo", "Ana"]); // 9 trails ranks above 5
  });

  it("shows the sign-in prompt for the friends board when needed", async () => {
    nav.params = new URLSearchParams("scope=friends");
    mockApi({ entries: [], needsSignIn: true });
    render(<LeaderboardBoard />);
    await waitFor(() =>
      expect(
        screen.getByText(/sign in to see your friends/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows an empty state when no one is on the board", async () => {
    mockApi({ entries: [] });
    render(<LeaderboardBoard />);
    await waitFor(() =>
      expect(screen.getByText(/no hikers on the board yet/i)).toBeInTheDocument(),
    );
  });

  it("requests the scope and window from the URL", async () => {
    nav.params = new URLSearchParams("scope=friends&window=year");
    let requested = "";
    const fetchMock = vi.fn((url: RequestInfo | URL) => {
      requested = String(url);
      return Promise.resolve({
        ok: true,
        json: async () => ({ entries: [] }),
      } as unknown as Response);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LeaderboardBoard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(requested).toContain("/api/leaderboard?scope=friends&window=year");
  });
});
