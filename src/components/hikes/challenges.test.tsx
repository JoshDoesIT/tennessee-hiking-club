import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Challenges } from "./challenges";
import { addHike } from "@/lib/hikes/local-log";
import type { Trail } from "@/lib/trails/schema";

const make = (slug: string, over: Partial<Trail> = {}): Trail => ({
  slug,
  name: slug,
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

// Five distinct trails so the "Five and Counting" (count: 5) challenge is reachable.
const trails: Trail[] = ["t1", "t2", "t3", "t4", "t5"].map((s) => make(s));

beforeEach(() => localStorage.clear());

describe("Challenges", () => {
  it("lists challenges with an accessible progress bar when nothing is logged", () => {
    render(<Challenges trails={trails} />);

    expect(
      screen.getByRole("heading", { name: /challenges/i }),
    ).toBeInTheDocument();

    const bar = screen.getByRole("progressbar", { name: /five and counting/i });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });

  it("marks a challenge earned once its criterion is met", () => {
    for (const t of trails) addHike(t.slug, "2026-05-01");

    render(<Challenges trails={trails} />);

    const heading = screen.getByRole("heading", { name: /five and counting/i });
    const card = heading.closest("li");
    expect(card).not.toBeNull();
    expect(within(card!).getByText(/earned/i)).toBeInTheDocument();
    // An earned challenge shows completion, not an in-flight progress bar.
    expect(within(card!).queryByRole("progressbar")).toBeNull();
  });
});
