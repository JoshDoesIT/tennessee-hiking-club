import { describe, it, expect } from "vitest";
import { productSchema } from "./schema";

const valid = {
  slug: "trail-tee",
  name: "Trail Tee",
  category: "apparel",
  description: "A soft cotton tee with the club badge.",
  priceCents: 2400,
  image: { src: "/shop/trail-tee.png", alt: "Trail tee" },
  sizes: ["S", "M", "L", "XL"],
};

describe("productSchema", () => {
  it("accepts a valid product and defaults currency to USD", () => {
    const p = productSchema.parse(valid);
    expect(p.currency).toBe("USD");
    expect(p.available).toBe(true);
  });

  it("rejects a non-kebab-case slug", () => {
    expect(() =>
      productSchema.parse({ ...valid, slug: "Trail Tee" }),
    ).toThrow();
  });

  it("rejects a non-positive price", () => {
    expect(() => productSchema.parse({ ...valid, priceCents: 0 })).toThrow();
    expect(() => productSchema.parse({ ...valid, priceCents: -100 })).toThrow();
  });

  it("requires a name and an image", () => {
    expect(() => productSchema.parse({ ...valid, name: "" })).toThrow();
    expect(() => productSchema.parse({ ...valid, image: undefined })).toThrow();
  });
});
