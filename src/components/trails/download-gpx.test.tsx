import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DownloadGpx } from "./download-gpx";

const route = [
  { lat: 35.6, lng: -83.45, elevationFt: 4000 },
  { lat: 35.66, lng: -83.42, elevationFt: 6593 },
];

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("DownloadGpx", () => {
  it("renders a Download GPX button", () => {
    render(<DownloadGpx trail={{ name: "Mount LeConte", route }} />);
    expect(
      screen.getByRole("button", { name: /download gpx/i }),
    ).toBeInTheDocument();
  });

  it("builds and downloads a GPX file on click", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const user = userEvent.setup();
    render(<DownloadGpx trail={{ name: "Mount LeConte", route }} />);

    await user.click(screen.getByRole("button", { name: /download gpx/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/gpx+xml");
    expect(await blob.text()).toContain("<gpx");
    expect(clickSpy).toHaveBeenCalled();
  });
});
