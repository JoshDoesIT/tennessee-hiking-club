import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { YourTennesseeMap } from "./your-tennessee-map";
import { addHike } from "@/lib/hikes/local-log";
import type { TennesseeMapData } from "./map-data";

const data: TennesseeMapData = {
  outline: "M0 0L10 0L10 10Z",
  pins: [
    { slug: "a", name: "Trail A", region: "East", xPct: 20, yPct: 30 },
    { slug: "b", name: "Trail B", region: "West", xPct: 60, yPct: 50 },
  ],
};

beforeEach(() => localStorage.clear());

describe("YourTennesseeMap", () => {
  it("renders a pin link per trail and a zero summary when nothing is logged", () => {
    render(<YourTennesseeMap data={data} />);

    const pins = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/trails/"));
    expect(pins).toHaveLength(2);
    expect(screen.getByRole("figure")).toHaveTextContent(/0 of 2\s+trails hiked/i);
  });

  it("lights up hiked trails and conveys it in the accessible name", () => {
    addHike("a", "2026-05-01");
    render(<YourTennesseeMap data={data} />);

    const hiked = screen.getByRole("link", { name: /trail a.*hiked/i });
    expect(hiked).toHaveAttribute("data-hiked", "true");
    expect(hiked).toHaveAttribute("href", "/trails/a");

    const notHiked = screen.getByRole("link", { name: /trail b/i });
    expect(notHiked).toHaveAttribute("data-hiked", "false");

    expect(screen.getByRole("figure")).toHaveTextContent(/1 of 2\s+trails hiked/i);
  });
});
