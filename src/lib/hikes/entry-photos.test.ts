import { describe, it, expect } from "vitest";
import {
  entryPhotos,
  entryPhotoIds,
  entryPhotoUrls,
} from "./entry-photos";
import type { HikeLogEntry } from "./types";

const base: HikeLogEntry = { trailSlug: "virgin-falls", hikedOn: "2026-06-14" };

describe("entryPhotos", () => {
  it("pairs local ids with uploaded urls by index", () => {
    expect(
      entryPhotos({ ...base, photoIds: ["a", "b"], photoUrls: ["ua", "ub"] }),
    ).toEqual([
      { id: "a", url: "ua" },
      { id: "b", url: "ub" },
    ]);
  });

  it("handles local ids with no uploads yet", () => {
    expect(entryPhotos({ ...base, photoIds: ["a", "b"] })).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("falls back to the legacy single photo fields", () => {
    expect(entryPhotos({ ...base, photoId: "x", photoUrl: "ux" })).toEqual([
      { id: "x", url: "ux" },
    ]);
    expect(entryPhotos({ ...base, photoId: "x" })).toEqual([{ id: "x" }]);
  });

  it("returns nothing for a hike with no photos", () => {
    expect(entryPhotos(base)).toEqual([]);
  });

  it("prefers the new arrays over the legacy fields when both exist", () => {
    expect(
      entryPhotos({ ...base, photoIds: ["a"], photoId: "legacy" }),
    ).toEqual([{ id: "a" }]);
  });
});

describe("entryPhotoIds / entryPhotoUrls", () => {
  it("collect new and legacy ids for cleanup, de-duplicated", () => {
    expect(
      entryPhotoIds({ ...base, photoIds: ["a", "b"], photoId: "a" }),
    ).toEqual(["a", "b"]);
    expect(entryPhotoIds({ ...base, photoId: "legacy" })).toEqual(["legacy"]);
    expect(entryPhotoIds(base)).toEqual([]);
  });

  it("collect new and legacy urls for cleanup", () => {
    expect(
      entryPhotoUrls({ ...base, photoUrls: ["ua"], photoUrl: "ub" }),
    ).toEqual(["ua", "ub"]);
    expect(entryPhotoUrls(base)).toEqual([]);
  });
});
