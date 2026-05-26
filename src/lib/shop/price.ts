/** Format an integer cent amount as a localized currency string. */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Total for a line item, in cents. Server-side source of truth for amounts. */
export function lineTotal(unitCents: number, quantity: number): number {
  return unitCents * quantity;
}
