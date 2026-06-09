import { describe, it, expect, vi } from "vitest";
import {
  liveActivityContent,
  syncRecordingActivity,
  type LiveActivityPlugin,
} from "./live-activity";
import type { RecordingSnapshot, RecordingStatus } from "./recording-store";

const snap = (
  status: RecordingStatus,
  over: Partial<RecordingSnapshot> = {},
): RecordingSnapshot => ({
  status,
  slug: "abrams-falls",
  trailName: "Abrams Falls",
  points: [],
  elapsedMs: 0,
  ...over,
});

describe("liveActivityContent", () => {
  it("derives the trail, distance, and whole-minute elapsed time", () => {
    const content = liveActivityContent(
      snap("recording", {
        elapsedMs: 125_000,
        points: [
          { lat: 35.9, lng: -83.9, elevationFt: 100 },
          { lat: 35.91, lng: -83.91, elevationFt: 120 },
        ],
      }),
    );
    expect(content.trailName).toBe("Abrams Falls");
    expect(content.elapsedMin).toBe(2);
    expect(content.distanceMi).toBeGreaterThan(0);
  });

  it("falls back to a generic title and zero distance with no route", () => {
    const content = liveActivityContent(snap("recording", { trailName: null }));
    expect(content.trailName).toMatch(/recording/i);
    expect(content.distanceMi).toBe(0);
  });
});

function fakePlugin(): LiveActivityPlugin {
  return {
    start: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    end: vi.fn(async () => {}),
  };
}

describe("syncRecordingActivity", () => {
  it("starts the activity when recording begins", async () => {
    const p = fakePlugin();
    await syncRecordingActivity(p, snap("idle"), snap("recording"));
    expect(p.start).toHaveBeenCalledOnce();
    expect(p.update).not.toHaveBeenCalled();
  });

  it("updates the activity as the recording progresses", async () => {
    const p = fakePlugin();
    await syncRecordingActivity(
      p,
      snap("recording"),
      snap("recording", { elapsedMs: 60_000 }),
    );
    expect(p.update).toHaveBeenCalledOnce();
    expect(p.start).not.toHaveBeenCalled();
  });

  it("keeps the activity through a pause (both are an active session)", async () => {
    const p = fakePlugin();
    await syncRecordingActivity(p, snap("recording"), snap("paused"));
    expect(p.update).toHaveBeenCalledOnce();
    expect(p.end).not.toHaveBeenCalled();
  });

  it("ends the activity when the session stops", async () => {
    const p = fakePlugin();
    await syncRecordingActivity(p, snap("paused"), snap("idle"));
    expect(p.end).toHaveBeenCalledOnce();
  });

  it("does nothing while idle", async () => {
    const p = fakePlugin();
    await syncRecordingActivity(p, snap("idle"), snap("idle"));
    expect(p.start).not.toHaveBeenCalled();
    expect(p.update).not.toHaveBeenCalled();
    expect(p.end).not.toHaveBeenCalled();
  });
});
