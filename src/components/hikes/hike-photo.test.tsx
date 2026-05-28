import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HikePhoto } from "./hike-photo";
import { getPhoto } from "@/lib/hikes/photo-store";

vi.mock("@/lib/hikes/photo-store", () => ({ getPhoto: vi.fn() }));

beforeEach(() => {
  vi.mocked(getPhoto).mockReset();
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("HikePhoto", () => {
  it("renders a remote photoUrl directly without touching IndexedDB", () => {
    render(<HikePhoto photoUrl="https://blob/p.jpg" alt="My hike photo" />);
    const img = screen.getByRole("img", { name: "My hike photo" });
    expect(img).toHaveAttribute("src", "https://blob/p.jpg");
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it("loads a local photo from IndexedDB and revokes the object URL on unmount", async () => {
    vi.mocked(getPhoto).mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
    const { unmount } = render(<HikePhoto photoId="p1" alt="Local hike photo" />);

    const img = await screen.findByRole("img", { name: "Local hike photo" });
    expect(img).toHaveAttribute("src", "blob:mock");
    expect(getPhoto).toHaveBeenCalledWith("p1");

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("renders nothing when there is no photo", () => {
    const { container } = render(<HikePhoto alt="none" />);
    expect(container).toBeEmptyDOMElement();
  });
});
