import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false },
};

export default function CheckoutCancelPage() {
  return (
    <Container className="max-w-2xl py-20 text-center sm:py-28">
      <p className="eyebrow text-amber-700">No worries</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Checkout canceled
      </h1>
      <p className="text-ink/75 mt-4 text-lg leading-relaxed">
        Your cart was not charged. The trails are still here whenever you are
        ready.
      </p>
      <div className="mt-8">
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Back to the shop
        </Link>
      </div>
    </Container>
  );
}
