import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Container className="max-w-2xl py-20 text-center sm:py-28">
      <p className="eyebrow text-amber-700">Thank you</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Your order is confirmed
      </h1>
      <p className="text-ink/75 mt-4 text-lg leading-relaxed">
        Thanks for supporting the Tennessee Hiking Club. Your merch prints on
        demand and ships within a few days, and a receipt is on the way to your
        email.
      </p>
      <div className="mt-8">
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Back to the shop
        </Link>
      </div>
    </Container>
  );
}
