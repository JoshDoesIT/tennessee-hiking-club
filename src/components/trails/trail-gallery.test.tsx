import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrailGallery } from "./trail-gallery";

describe("TrailGallery", () => {
  it("renders an image for every photo, with alt text and credit", () => {
    render(
      <TrailGallery
        photos={[
          { src: "/a.png", alt: "Alpha ridge" },
          { src: "/b.png", alt: "Beta falls", credit: "Photo: Someone" },
        ]}
      />,
    );
    expect(screen.getByAltText("Alpha ridge")).toBeInTheDocument();
    expect(screen.getByAltText("Beta falls")).toBeInTheDocument();
    expect(screen.getByText("Photo: Someone")).toBeInTheDocument();
  });

  it("renders nothing when there are no photos", () => {
    const { container } = render(<TrailGallery photos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
