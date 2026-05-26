import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/shop/product-card";
import { getAllProducts } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Tennessee Hiking Club merch: print-on-demand tees, stickers, and caps that help fund the project.",
};

export default function ShopPage() {
  const products = getAllProducts();

  return (
    <Container className="py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Club merch</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Shop the Hiking Club
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Print-on-demand tees, stickers, and caps. Every order helps cover
        hosting and the domain, so the map stays free for everyone.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
