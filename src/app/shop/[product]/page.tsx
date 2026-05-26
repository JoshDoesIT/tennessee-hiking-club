import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/shop";
import { formatPrice } from "@/lib/shop/price";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

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

          {product.sizes.length > 0 ? (
            <Variants label="Size" options={product.sizes} />
          ) : null}
          {product.colors.length > 0 ? (
            <Variants label="Color" options={product.colors} />
          ) : null}

          <p className="text-ink/70 mt-8 text-sm">
            Checkout is coming soon, with hosted, secure payment via Stripe.
          </p>
        </div>
      </div>
    </Container>
  );
}

function Variants({ label, options }: { label: string; options: string[] }) {
  return (
    <fieldset className="mt-6">
      <legend className="text-forest text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <span
            key={o}
            className="border-forest/20 text-ink/80 rounded-full border px-3 py-1 text-sm"
          >
            {o}
          </span>
        ))}
      </div>
    </fieldset>
  );
}
