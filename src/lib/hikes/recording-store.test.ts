import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RoutePoint } from "@/lib/trails/elevation";

let onPoint: ((p: RoutePoint) => void) | null = null;
const stop = vi.fn();
const startLocationWatch = vi.fn(async (op: (p: RoutePoint) => void) => {
  onPoint = op;
  return stop;
});
vi.mock("@/lib/hikes/geo-watcher", () => ({
  startLocationWatch: (...a: unknown[]) =>
    (startLocationWatch as (...a: unknown[]) => unknown)(...a),
}));
const addHike = vi.fn();
vi.mock("@/lib/hikes/local-log", () => ({
  addHike: (...a: unknown[]) => addHike(...a),
}));

import {
  startRecording,
  pauseRecording,
  resumeRecording,
  discardRecording,
  finishRecording,
  readRecording,
} from "./recording-store";

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as unknown as Storage;
}

const pt = (lat: number, lng: number): RoutePoint => ({
  lat,
  lng,
  elevationFt: 5000,
});

let storage: Storage;
beforeEach(async () => {
  storage = memStorage();
  onPoint = null;
  stop.mockClear();
  startLocationWatch.mockClear();
  addHike.mockClear();
});

describe("recording-store", () => {
  it("starts recording for a trail and begins the location watch", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    const s = readRecording(storage);
    expect(s.status).toBe("recording");
    expect(s.slug).toBe("abrams-falls");
    expect(s.trailName).toBe("Abrams Falls");
    expect(s.points).toEqual([]);
    expect(startLocationWatch).toHaveBeenCalledTimes(1);
  });

  it("accumulates points from the watch and persists them", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    onPoint?.(pt(35.6, -83.45));
    onPoint?.(pt(35.61, -83.44));
    expect(readRecording(storage).points).toHaveLength(2);
  });

  it("pauses (stopping the watch) and resumes (restarting it)", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    pauseRecording(storage);
    expect(readRecording(storage).status).toBe("paused");
    expect(stop).toHaveBeenCalled();
    resumeRecording(storage);
    await Promise.resolve();
    expect(readRecording(storage).status).toBe("recording");
    expect(startLocationWatch).toHaveBeenCalledTimes(2);
  });

  it("discards back to idle without logging a hike", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    onPoint?.(pt(35.6, -83.45));
    discardRecording(storage);
    expect(readRecording(storage).status).toBe("idle");
    expect(readRecording(storage).points).toEqual([]);
    expect(addHike).not.toHaveBeenCalled();
  });

  it("finishes by logging the track and resets to idle", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    onPoint?.(pt(35.6, -83.45));
    onPoint?.(pt(35.61, -83.44));
    expect(finishRecording(storage)).toBe(true);
    expect(addHike).toHaveBeenCalledTimes(1);
    expect(addHike.mock.calls[0][0]).toBe("abrams-falls");
    expect(readRecording(storage).status).toBe("idle");
  });

  it("does not save a finish with fewer than two points", async () => {
    startRecording("abrams-falls", "Abrams Falls", storage);
    await Promise.resolve();
    onPoint?.(pt(35.6, -83.45));
    expect(finishRecording(storage)).toBe(false);
    expect(addHike).not.toHaveBeenCalled();
    expect(readRecording(storage).status).toBe("idle");
  });

  it("recovers an interrupted recording from storage as paused", () => {
    storage.setItem(
      "tnhc:recording",
      JSON.stringify({
        status: "recording",
        slug: "abrams-falls",
        trailName: "Abrams Falls",
        points: [pt(35.6, -83.45), pt(35.61, -83.44)],
        elapsedMs: 1000,
        segmentStart: 123,
      }),
    );
    const s = readRecording(storage);
    expect(s.status).toBe("paused");
    expect(s.points).toHaveLength(2);
  });
});
