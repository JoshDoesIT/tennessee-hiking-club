import { describe, it, expect } from "vitest";
import { extractImageUrls } from "./precache-images";

describe("extractImageUrls", () => {
  it("finds the optimized image URL in an img src", () => {
    const html = `<img src="/_next/image?url=%2Fphoto.jpg&amp;w=750&amp;q=75" />`;
    expect(extractImageUrls(html)).toEqual([
      "/_next/image?url=%2Fphoto.jpg&w=750&q=75",
    ]);
  });

  it("collects every width from a srcset and dedupes", () => {
    const html = `
      <img
        src="/_next/image?url=%2Fa.jpg&amp;w=1080&amp;q=75"
        srcset="/_next/image?url=%2Fa.jpg&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fa.jpg&amp;w=1080&amp;q=75 1080w" />`;
    expect(extractImageUrls(html).sort()).toEqual([
      "/_next/image?url=%2Fa.jpg&w=1080&q=75",
      "/_next/image?url=%2Fa.jpg&w=640&q=75",
    ]);
  });

  it("returns nothing when there are no optimized images", () => {
    expect(extractImageUrls("<p>no pictures here</p>")).toEqual([]);
  });

  it("handles remote photos proxied through the optimizer", () => {
    const html = `<img src="/_next/image?url=https%3A%2F%2Fcdn.example.com%2Fp.jpg&amp;w=828&amp;q=70">`;
    expect(extractImageUrls(html)).toEqual([
      "/_next/image?url=https%3A%2F%2Fcdn.example.com%2Fp.jpg&w=828&q=70",
    ]);
  });
});
