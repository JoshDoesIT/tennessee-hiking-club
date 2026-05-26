import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/shop";
import { formatPrice } from "@/lib/shop/price";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Params = { params: Promise<{ product: string }> };

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ product: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { product: slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: Params) {
  const { product: slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link href="/shop" className="text-olive hover:text-forest text-sm">
        ← Back to the shop
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="bg-parchment border-forest/10 grid place-items-center rounded-2xl border p-10">
          <Image
            src={product.image.src}
            alt={product.image.alt}
            width={360}
            height={360}
            priority
            className="h-auto w-2/3 object-contain"
          />
        </div>

        <div>
          <Badge variant="outline">{product.category}</Badge>
          <h1 className="display text-forest mt-3 text-3xl sm:text-4xl">
            {product.name}
          </h1>
          <p className="text-forest mt-2 text-2xl font-semibold">
            {formatPrice(product.priceCents, product.currency)}
          </p>
          <p className="text-ink/75 mt-4 leading-relaxed">
            {product.body || product.description}
          </p>

          <form action="/api/checkout" method="post">
            <input type="hidden" name="slug" value={product.slug} />
            {product.sizes.length > 0 ? (
              <VariantSelect label="Size" name="size" options={product.sizes} />
            ) : null}
            {product.colors.length > 0 ? (
              <VariantSelect
                label="Color"
                name="color"
                options={product.colors}
              />
            ) : null}

            <div className="mt-5 flex items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="quantity"
                  className="text-forest text-sm font-medium"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={1}
                  inputMode="numeric"
                  className="border-forest/20 bg-cream text-ink w-20 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" variant="accent" size="lg">
                Buy now
              </Button>
            </div>
            <p className="text-ink/70 mt-3 text-sm">
              Secure, hosted checkout via Stripe. No charge until you confirm.
            </p>
          </form>
        </div>
      </div>
    </Container>
  );
}

function VariantSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <label htmlFor={name} className="text-forest text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="border-forest/20 bg-cream text-ink max-w-xs rounded-lg border px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
