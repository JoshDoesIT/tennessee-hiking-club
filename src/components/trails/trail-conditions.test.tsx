import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TrailConditions } from "./trail-conditions";

const now = new Date("2026-05-28T12:00:00Z");
const trail = {
  slug: "x-trail",
  name: "X Trail",
  alerts: [
    {
      level: "closure" as const,
      message: "Footbridge out past mile 2",
      date: "2026-05-01",
    },
  ],
  conditionReports: [
    { date: "2026-01-01", status: "Open" },
    { date: "2026-05-20", status: "Muddy", note: "Slick near the base" },
  ],
};

describe("TrailConditions", () => {
  it("shows a pinned alert with its message", () => {
    render(<TrailConditions trail={trail} now={now} />);
    expect(screen.getByText(/footbridge out past mile 2/i)).toBeInTheDocument();
  });

  it("lists condition reports newest first", () => {
    render(<TrailConditions trail={trail} now={now} />);
    const list = screen.getByRole("list", {
      name: /recent condition reports/i,
    });
    const items = within(list).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/muddy/i);
    expect(items[1]).toHaveTextContent(/open/i);
  });

  it("marks a stale report as out of date, but not a fresh one", () => {
    render(<TrailConditions trail={trail} now={now} />);
    expect(screen.getByText("Open").closest("li")).toHaveTextContent(
      /out of date/i,
    );
    expect(screen.getByText("Muddy").closest("li")).not.toHaveTextContent(
      /out of date/i,
    );
  });

  it("links to the prefilled condition-report form", () => {
    render(<TrailConditions trail={trail} now={now} />);
    const link = screen.getByRole("link", {
      name: /report current conditions/i,
    });
    expect(link.getAttribute("href")).toContain("template=trail_condition.yml");
  });

  it("shows an empty state when there are no reports or alerts", () => {
    render(
      <TrailConditions
        trail={{ ...trail, alerts: [], conditionReports: [] }}
        now={now}
      />,
    );
    expect(
      screen.getByText(/no recent condition reports/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /report current conditions/i }),
    ).toBeInTheDocument();
  });
});
