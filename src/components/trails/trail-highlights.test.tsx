import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrailHighlights } from "./trail-highlights";

describe("TrailHighlights", () => {
  it("renders nothing when there are no waypoints", () => {
    const { container } = render(<TrailHighlights waypoints={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each waypoint with its name, type, and description", () => {
    render(
      <TrailHighlights
        waypoints={[
          { lat: 35.8, lng: -85.2, name: "Big Falls", type: "waterfall", description: "110-ft drop" },
          { lat: 35.81, lng: -85.21, name: "The Overlook", type: "viewpoint" },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /along the trail/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Big Falls")).toBeInTheDocument();
    expect(screen.getByText(/110-ft drop/)).toBeInTheDocument();
    expect(screen.getByText("The Overlook")).toBeInTheDocument();
    expect(screen.getByText(/waterfall/i)).toBeInTheDocument();
  });
});
