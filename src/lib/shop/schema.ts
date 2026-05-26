import { z } from "zod";

/** kebab-case: lowercase words separated by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CATEGORIES = ["apparel", "sticker", "accessory"] as const;

/**
 * The merch product model: the executable spec for all `content/products`.
 * Front-matter is validated against this; invalid data throws at build/test
 * time so the storefront never ships a broken product. Prices live here (the
 * server source of truth) and are never trusted from the client at checkout.
 */
export const productSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, "slug must be kebab-case"),
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  description: z.string().min(1),
  priceCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  image: z.object({ src: z.string().min(1), alt: z.string().min(1) }),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  available: z.boolean().default(true),
  body: z.string().default(""),
});

export type Product = z.infer<typeof productSchema>;
export type Category = (typeof CATEGORIES)[number];
