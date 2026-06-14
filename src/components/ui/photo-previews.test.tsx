import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoPreviews } from "./photo-previews";

let created: string[] = [];
let revoked: string[] = [];

beforeEach(() => {
  created = [];
  revoked = [];
  let n = 0;
  URL.createObjectURL = vi.fn(() => {
    const u = `blob:mock-${n++}`;
    created.push(u);
    return u;
  });
  URL.revokeObjectURL = vi.fn((u: string) => {
    revoked.push(u);
  });
});

afterEach(() => vi.restoreAllMocks());

function imageFile(name: string) {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });
}

describe("PhotoPreviews", () => {
  it("renders nothing when there are no files", async () => {
    const { container } = render(<PhotoPreviews files={[]} />);
    await new Promise((r) => setTimeout(r));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a thumbnail per selected image so the right photo is verifiable", async () => {
    render(<PhotoPreviews files={[imageFile("a.jpg"), imageFile("b.jpg")]} />);
    const imgs = await screen.findAllByRole("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", expect.stringContaining("blob:"));
  });

  it("ignores non-image files", async () => {
    const gpx = new File(["<gpx/>"], "track.gpx", {
      type: "application/gpx+xml",
    });
    render(<PhotoPreviews files={[imageFile("a.jpg"), gpx]} />);
    expect(await screen.findAllByRole("img")).toHaveLength(1);
  });

  it("revokes the object URLs it created on unmount", async () => {
    const { unmount } = render(<PhotoPreviews files={[imageFile("a.jpg")]} />);
    await screen.findByRole("img");
    expect(created).toHaveLength(1);
    unmount();
    expect(revoked).toEqual(created);
  });
});
