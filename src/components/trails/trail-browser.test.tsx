import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Trail } from "@/lib/trails/schema";

const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.params,
  useRouter: () => ({ replace: nav.replace, push: nav.replace }),
}));
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
// Keep this unit on filtering + URL wiring, not the results grid (its own test).
vi.mock("./trail-results", () => ({
  TrailResults: ({ trails }: { trails: Trail[] }) => (
    <div data-testid="results" data-count={trails.length} />
  ),
}));

import { TrailBrowser } from "./trail-browser";

const make = (over: Partial<Trail>): Trail => ({
  slug: "x",
  name: "X",
  region: "East",
  area: "A",
  coordinates: { lat: 0, lng: 0 },
  lengthMiles: 5,
  elevationGainFt: 100,
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

const trails = [
  make({ slug: "a", name: "Abrams Falls", region: "East", lengthMiles: 5 }),
  make({ slug: "b", name: "Big Ridge", region: "Middle", lengthMiles: 12 }),
  make({ slug: "c", name: "Cedar Loop", region: "East", lengthMiles: 2 }),
];

const resultCount = () =>
  Number(screen.getByTestId("results").getAttribute("data-count"));

beforeEach(() => {
  nav.params = new URLSearchParams();
  nav.replace.mockClear();
});

describe("TrailBrowser", () => {
  it("shows every trail when the URL has no filters", () => {
    render(<TrailBrowser trails={trails} />);
    expect(resultCount()).toBe(3);
    expect(screen.getByText("3 trails")).toBeInTheDocument();
  });

  it("filters the list from the URL search params", () => {
    nav.params = new URLSearchParams("region=East");
    render(<TrailBrowser trails={trails} />);
    expect(resultCount()).toBe(2);
    expect(screen.getByText("Showing 2 of 3 trails")).toBeInTheDocument();
  });

  it("puts the chosen filters in the URL on submit", async () => {
    const user = userEvent.setup();
    render(<TrailBrowser trails={trails} />);
    await user.selectOptions(screen.getByLabelText("Region"), "East");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(nav.replace).toHaveBeenCalledWith("/trails?region=East", {
      scroll: false,
    });
  });

  it("offers a clear control back to /trails only when filtered", () => {
    const { unmount } = render(<TrailBrowser trails={trails} />);
    expect(screen.queryByRole("link", { name: /clear/i })).toBeNull();
    unmount();

    nav.params = new URLSearchParams("region=East");
    render(<TrailBrowser trails={trails} />);
    expect(screen.getByRole("link", { name: /^clear$/i })).toHaveAttribute(
      "href",
      "/trails",
    );
  });

  it("shows an empty state when nothing matches", () => {
    nav.params = new URLSearchParams("q=zzz");
    render(<TrailBrowser trails={trails} />);
    expect(screen.getByText(/no trails match/i)).toBeInTheDocument();
    expect(screen.queryByTestId("results")).toBeNull();
  });
});
