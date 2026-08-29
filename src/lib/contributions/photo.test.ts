import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import {
  validatePhotoSubmission,
  isAcceptableImage,
  generatePhotoEntry,
  appendPhoto,
} from "./photo";

describe("validatePhotoSubmission", () => {
  const valid = { trailSlug: "virgin-falls", alt: "The falls in spring flow" };

  it("accepts a slug and alt text, with optional credit", () => {
    expect(validatePhotoSubmission(valid).success).toBe(true);
    expect(
      validatePhotoSubmission({ ...valid, credit: "Photo by Trail Ann" })
        .success,
    ).toBe(true);
  });

  it("requires alt text for accessibility", () => {
    expect(validatePhotoSubmission({ trailSlug: "virgin-falls" }).success).toBe(
      false,
    );
    expect(validatePhotoSubmission({ ...valid, alt: "  " }).success).toBe(
      false,
    );
  });

  it("requires a trail slug", () => {
    expect(validatePhotoSubmission({ alt: "A photo" }).success).toBe(false);
  });
});

describe("isAcceptableImage", () => {
  it("accepts an image within the size limit", () => {
    expect(isAcceptableImage("image/jpeg", 2_000_000)).toBe(true);
  });

  it("rejects a non-image type", () => {
    expect(isAcceptableImage("text/plain", 100)).toBe(false);
  });

  it("rejects an oversized image", () => {
    expect(isAcceptableImage("image/jpeg", 99_000_000)).toBe(false);
  });
});

describe("generatePhotoEntry", () => {
  it("produces a photos[] entry that round-trips through the schema", () => {
    const entry = generatePhotoEntry({
      src: "/trails/contributed/virgin-falls-abc.jpg",
      alt: "The falls in spring flow",
      credit: "Photo by Trail Ann",
      by: "trail-ann",
    });
    expect(entry.valid).toBe(true);
    const doc = matter(`---\nphotos:\n${entry.yaml}\n---\n`);
    expect(doc.data.photos[0]).toMatchObject({
      src: "/trails/contributed/virgin-falls-abc.jpg",
      alt: "The falls in spring flow",
      credit: "Photo by Trail Ann",
      by: "trail-ann",
    });
  });

  it("omits absent credit and by", () => {
    const entry = generatePhotoEntry({ src: "/p.jpg", alt: "A photo" });
    expect(entry.yaml).not.toContain("credit:");
    expect(entry.yaml).not.toContain("by:");
    expect(entry.valid).toBe(true);
  });
});

describe("appendPhoto", () => {
  it("appends to a trail's existing photos list", () => {
    const file = [
      "---",
      "slug: virgin-falls",
      "photos:",
      '  - src: "/trails/virgin-falls.jpg"',
      "    alt: Existing",
      "---",
      "",
      "Body.",
    ].join("\n");
    const out = appendPhoto(file, { src: "/p.jpg", alt: "New", by: "ann" });
    const { data } = matter(out);
    expect(data.photos).toHaveLength(2);
    expect(data.photos).toContainEqual(
      expect.objectContaining({ src: "/p.jpg", alt: "New", by: "ann" }),
    );
  });
});
