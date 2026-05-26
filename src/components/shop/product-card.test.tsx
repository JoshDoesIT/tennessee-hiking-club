import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/shop/schema";

const product: Product = {
  slug: "trail-tee",
  name: "Trail Tee",
  category: "apparel",
  description: "A soft tee.",
  priceCents: 2400,
  currency: "USD",
  image: { src: "/logo.png", alt: "Trail tee" },
  sizes: ["S", "M", "L"],
  colors: [],
  available: true,
  body: "",
};

describe("ProductCard", () => {
  it("links to the product and shows its name and formatted price", () => {
    render(<ProductCard product={product} />);
    const link = screen.getByRole("link", { name: /Trail Tee/i });
    expect(link).toHaveAttribute("href", "/shop/trail-tee");
    expect(screen.getByText("$24.00")).toBeInTheDocument();
  });
});
