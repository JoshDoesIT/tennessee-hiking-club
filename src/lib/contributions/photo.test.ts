import { describe, it, expect } from "vitest";
import { validatePhotoSubmission, isAcceptableImage } from "./photo";

describe("validatePhotoSubmission", () => {
  const valid = { trailSlug: "virgin-falls", alt: "The falls in spring flow" };

  it("accepts a slug and alt text, with optional credit", () => {
    expect(validatePhotoSubmission(valid).success).toBe(true);
    expect(
      validatePhotoSubmission({ ...valid, credit: "Photo by Trail Ann" }).success,
    ).toBe(true);
  });

  it("requires alt text for accessibility", () => {
    expect(validatePhotoSubmission({ trailSlug: "virgin-falls" }).success).toBe(
      false,
    );
    expect(validatePhotoSubmission({ ...valid, alt: "  " }).success).toBe(false);
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
