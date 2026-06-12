import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkHiked } from "./mark-hiked";
import { isHiked, readLog } from "@/lib/hikes/local-log";
import { compressImage } from "@/lib/hikes/image";
import { putPhoto } from "@/lib/hikes/photo-store";
import { uploadPhoto } from "@/lib/hikes/photo-upload";

vi.mock("@/lib/hikes/image", () => ({ compressImage: vi.fn() }));
vi.mock("@/lib/hikes/photo-store", () => ({
  putPhoto: vi.fn(),
  deletePhoto: vi.fn(),
}));
vi.mock("@/lib/hikes/photo-upload", () => ({
  uploadPhoto: vi.fn(),
  deleteRemotePhoto: vi.fn(),
}));

const GPX =
  `<gpx><trk><trkseg>` +
  `<trkpt lat="35.60" lon="-83.45"><ele>1000</ele><time>2026-05-30T08:00:00Z</time></trkpt>` +
  `<trkpt lat="35.62" lon="-83.44"><ele>1200</ele><time>2026-05-30T09:30:00Z</time></trkpt>` +
  `</trkseg></trk></gpx>`;

beforeEach(() => {
  localStorage.clear();
  vi.mocked(compressImage).mockResolvedValue(
    new Blob(["compressed"], { type: "image/jpeg" }),
  );
  vi.mocked(putPhoto).mockReset().mockResolvedValue(undefined);
  // Default: signed out / no Blob store, so the photo stays local.
  vi.mocked(uploadPhoto).mockReset().mockResolvedValue(null);
});

describe("MarkHiked", () => {
  it("logs a hike and then offers to log another", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);
    expect(isHiked("radnor-lake")).toBe(false);

    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(isHiked("radnor-lake")).toBe(true);
    expect(
      screen.getByRole("button", { name: /log another hike/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/hiked 1 time/i)).toBeInTheDocument();
  });

  it("logs an optional note and conditions when provided", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    await user.selectOptions(screen.getByLabelText(/conditions/i), "Muddy");
    await user.type(screen.getByLabelText(/note/i), "spring wildflowers");
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(readLog().find((e) => e.trailSlug === "radnor-lake")).toMatchObject({
      conditions: "Muddy",
      note: "spring wildflowers",
    });
  });

  it("logs on a chosen, backdated date", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    fireEvent.change(screen.getByLabelText(/date hiked/i), {
      target: { value: "2025-07-04" },
    });
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(readLog().find((e) => e.trailSlug === "radnor-lake")?.hikedOn).toBe(
      "2025-07-04",
    );
  });

  it("logs the same trail more than once on different dates", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    fireEvent.change(screen.getByLabelText(/date hiked/i), {
      target: { value: "2025-07-04" },
    });
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    fireEvent.change(screen.getByLabelText(/date hiked/i), {
      target: { value: "2025-08-15" },
    });
    await user.click(screen.getByRole("button", { name: /log another hike/i }));

    const dates = readLog()
      .filter((e) => e.trailSlug === "radnor-lake")
      .map((e) => e.hikedOn)
      .sort();
    expect(dates).toEqual(["2025-07-04", "2025-08-15"]);
  });

  it("does not duplicate a hike already logged for that date", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));
    await user.click(screen.getByRole("button", { name: /log another hike/i }));

    expect(readLog().filter((e) => e.trailSlug === "radnor-lake")).toHaveLength(
      1,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/already logged/i);
  });

  it("compresses and stores a chosen photo, linking it to the hike", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    const file = new File(["raw-bytes"], "trail.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText(/photo/i), file);
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(compressImage).toHaveBeenCalledWith(file);
    expect(putPhoto).toHaveBeenCalledTimes(1);
    const [storedId] = vi.mocked(putPhoto).mock.calls[0];
    expect(readLog().find((e) => e.trailSlug === "radnor-lake")?.photoId).toBe(
      storedId,
    );
  });

  it("uploads the photo and records its URL when signed in", async () => {
    vi.mocked(uploadPhoto).mockResolvedValue("https://b/p.jpg");
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    await user.upload(
      screen.getByLabelText(/photo/i),
      new File(["raw"], "t.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(
        readLog().find((e) => e.trailSlug === "radnor-lake")?.photoUrl,
      ).toBe("https://b/p.jpg");
    });
  });

  it("parses an uploaded GPX track and stores it on the hike", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="grotto-falls" />);

    await user.click(screen.getByRole("button", { name: /add a date/i }));
    await user.upload(
      screen.getByLabelText(/recorded track/i),
      new File([GPX], "hike.gpx", { type: "application/gpx+xml" }),
    );
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    await vi.waitFor(() => {
      const entry = readLog().find((e) => e.trailSlug === "grotto-falls");
      expect(entry?.track?.points.length).toBeGreaterThanOrEqual(2);
      expect(entry?.track?.durationMin).toBe(90);
    });
  });
});
