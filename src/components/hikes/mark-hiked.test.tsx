import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkHiked } from "./mark-hiked";
import { isHiked, readLog, addHike, setEntryPhotoUrl } from "@/lib/hikes/local-log";
import { compressImage } from "@/lib/hikes/image";
import { putPhoto } from "@/lib/hikes/photo-store";
import { uploadPhoto, deleteRemotePhoto } from "@/lib/hikes/photo-upload";

vi.mock("@/lib/hikes/image", () => ({ compressImage: vi.fn() }));
vi.mock("@/lib/hikes/photo-store", () => ({ putPhoto: vi.fn(), deletePhoto: vi.fn() }));
vi.mock("@/lib/hikes/photo-upload", () => ({
  uploadPhoto: vi.fn(),
  deleteRemotePhoto: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  vi.mocked(compressImage).mockResolvedValue(
    new Blob(["compressed"], { type: "image/jpeg" }),
  );
  vi.mocked(putPhoto).mockReset().mockResolvedValue(undefined);
  // Default: signed out / no Blob store, so the photo stays local.
  vi.mocked(uploadPhoto).mockReset().mockResolvedValue(null);
  vi.mocked(deleteRemotePhoto).mockReset().mockResolvedValue(undefined);
});

describe("MarkHiked", () => {
  it("toggles hiked state and persists it locally", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    const button = await screen.findByRole("button", {
      name: /mark as hiked/i,
    });
    expect(isHiked("radnor-lake")).toBe(false);

    await user.click(button);
    expect(isHiked("radnor-lake")).toBe(true);
    const pressed = screen.getByRole("button", { name: /hiked/i });
    expect(pressed).toHaveAttribute("aria-pressed", "true");

    await user.click(pressed);
    expect(isHiked("radnor-lake")).toBe(false);
  });

  it("logs an optional note and conditions when provided", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a note/i }));
    await user.selectOptions(screen.getByLabelText(/conditions/i), "Muddy");
    await user.type(screen.getByLabelText(/note/i), "spring wildflowers");
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    const entry = readLog().find((e) => e.trailSlug === "radnor-lake");
    expect(entry).toMatchObject({
      conditions: "Muddy",
      note: "spring wildflowers",
    });
  });

  it("compresses and stores a chosen photo, linking it to the hike", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a note/i }));
    const input = screen.getByLabelText(/photo/i);
    const file = new File(["raw-bytes"], "trail.jpg", { type: "image/jpeg" });
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(compressImage).toHaveBeenCalledWith(file);
    expect(putPhoto).toHaveBeenCalledTimes(1);
    const [storedId] = vi.mocked(putPhoto).mock.calls[0];
    const entry = readLog().find((e) => e.trailSlug === "radnor-lake");
    expect(entry?.photoId).toBe(storedId);
  });

  it("uploads the photo and records its URL when signed in", async () => {
    vi.mocked(uploadPhoto).mockResolvedValue("https://b/p.jpg");
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a note/i }));
    await user.upload(
      screen.getByLabelText(/photo/i),
      new File(["raw"], "t.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      const entry = readLog().find((e) => e.trailSlug === "radnor-lake");
      expect(entry?.photoUrl).toBe("https://b/p.jpg");
    });
  });

  it("parses an uploaded GPX track and stores it on the hike", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="grotto-falls" />);

    await user.click(screen.getByRole("button", { name: /add a note/i }));
    const gpx =
      `<gpx><trk><trkseg>` +
      `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele><time>2026-05-30T08:00:00Z</time></trkpt>` +
      `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele><time>2026-05-30T09:30:00Z</time></trkpt>` +
      `</trkseg></trk></gpx>`;
    const file = new File([gpx], "hike.gpx", { type: "application/gpx+xml" });
    await user.upload(screen.getByLabelText(/recorded track/i), file);
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    await vi.waitFor(() => {
      const entry = readLog().find((e) => e.trailSlug === "grotto-falls");
      expect(entry?.track?.points.length).toBeGreaterThanOrEqual(2);
      expect(entry?.track?.durationMin).toBe(90);
    });
  });

  it("deletes the remote photo when a hike with one is un-marked", async () => {
    addHike("radnor-lake", "2026-01-01", { photoId: "ph-1" });
    setEntryPhotoUrl("radnor-lake", "2026-01-01", "https://b/p.jpg");
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(await screen.findByRole("button", { name: /^hiked$/i }));

    expect(isHiked("radnor-lake")).toBe(false);
    expect(deleteRemotePhoto).toHaveBeenCalledWith("https://b/p.jpg");
  });
});
