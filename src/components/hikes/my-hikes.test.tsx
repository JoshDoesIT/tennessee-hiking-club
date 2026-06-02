import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyHikes } from "./my-hikes";
import { addHike } from "@/lib/hikes/local-log";
import { putPhoto } from "@/lib/hikes/photo-store";
import type { Trail } from "@/lib/trails/schema";

function resetPhotos(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase("tnhc");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

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
  make({ slug: "a", name: "Alpha", region: "East", lengthMiles: 11 }),
  make({ slug: "b", name: "Beta", region: "Middle", lengthMiles: 2 }),
];

beforeEach(async () => {
  localStorage.clear();
  await resetPhotos();
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("MyHikes", () => {
  it("shows an empty state when nothing is logged", async () => {
    render(<MyHikes trails={trails} />);
    expect(await screen.findByText(/no hikes logged/i)).toBeInTheDocument();
  });

  it("lists logged trails with personal stats", async () => {
    addHike("a", "2026-01-01");
    render(<MyHikes trails={trails} />);
    expect(await screen.findByRole("link", { name: /Alpha/i })).toHaveAttribute(
      "href",
      "/trails/a",
    );
    expect(screen.getByText(/11 mi/)).toBeInTheDocument();
  });

  it("surfaces the note and conditions from a logged hike", async () => {
    addHike("a", "2026-01-01", {
      note: "spring wildflowers",
      conditions: "Muddy",
    });
    render(<MyHikes trails={trails} />);
    expect(
      await screen.findByText(/spring wildflowers/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/muddy/i)).toBeInTheDocument();
  });

  it("shows a thumbnail for a hike that has a photo", async () => {
    await putPhoto("ph-1", new Blob(["img"], { type: "image/jpeg" }));
    addHike("a", "2026-01-01", { photoId: "ph-1" });
    render(<MyHikes trails={trails} />);
    const img = await screen.findByRole("img");
    expect(img).toHaveAttribute("src", "blob:mock");
    expect(img).toHaveAccessibleName(/Alpha/i);
  });

  it("shows no image when no hike has a photo", async () => {
    addHike("a", "2026-01-01");
    render(<MyHikes trails={trails} />);
    await screen.findByRole("link", { name: /Alpha/i });
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows a recorded track's stats and a GPX download", async () => {
    addHike("a", "2026-01-01", {
      track: {
        points: [
          { lat: 35.6, lng: -83.45, elevationFt: 1000 },
          { lat: 35.62, lng: -83.44, elevationFt: 1200 },
        ],
        durationMin: 90,
      },
    });
    render(<MyHikes trails={trails} />);
    expect(await screen.findByText(/recorded track/i)).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download gpx/i }),
    ).toBeInTheDocument();
  });

  it("lists hikes by date and deletes a single one", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      async (_input?: unknown, _init?: RequestInit) => ({ ok: true }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    addHike("a", "2026-02-10");
    addHike("a", "2026-05-20");
    render(<MyHikes trails={trails} />);

    // Both dated entries for the same trail are listed.
    expect(screen.getByText("Feb 10, 2026")).toBeInTheDocument();
    expect(screen.getByText("May 20, 2026")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /delete your Alpha hike on Feb 10, 2026/i }),
    );

    // The other hike remains; the deleted date is gone; a remote delete fired.
    expect(screen.queryByText("Feb 10, 2026")).toBeNull();
    expect(screen.getByText("May 20, 2026")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        (c) =>
          String(c[0]).includes("/api/hikes/sync") && c[1]?.method === "DELETE",
      ),
    ).toBe(true);
  });
});

afterEach(() => vi.unstubAllGlobals());
