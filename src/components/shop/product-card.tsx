import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/shop/price";
import type { Product } from "@/lib/shop/schema";

/** A single product in the shop grid: image, category, name, price. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card interactive className="overflow-hidden p-0">
      <Link
        href={`/shop/${product.slug}`}
        className="block focus-visible:outline-none"
      >
        <div className="bg-parchment grid aspect-square place-items-center p-8">
          <Image
            src={product.image.src}
            alt={product.image.alt}
            width={240}
            height={240}
            className="h-auto w-2/3 object-contain"
          />
        </div>
        <div className="p-5">
          <Badge variant="outline">{product.category}</Badge>
          <h3 className="display text-forest mt-3 text-xl leading-tight">
            {product.name}
          </h3>
          <p className="text-forest mt-1 font-semibold">
            {formatPrice(product.priceCents, product.currency)}
          </p>
        </div>
      </Link>
    </Card>
  );
}
