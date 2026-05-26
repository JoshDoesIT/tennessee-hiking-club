import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { productSchema, type Product } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "products");

/**
 * Load and validate every product Markdown file in `dir`. Throws a descriptive
 * error (naming the file and field) on invalid data or a duplicate slug.
 * Returns products sorted by name. Missing dir → empty array.
 */
export function loadProductsFrom(dir: string): Product[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const seen = new Map<string, string>();
  const products: Product[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);

    const parsed = productSchema.safeParse({ ...data, body: content.trim() });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.length ? issue.path.join(".") : "(root)";
      throw new Error(`Invalid product "${file}": ${field}: ${issue.message}`);
    }

    const product = parsed.data;
    const prior = seen.get(product.slug);
    if (prior) {
      throw new Error(
        `Duplicate product slug "${product.slug}" in "${file}" (already defined in "${prior}")`,
      );
    }
    seen.set(product.slug, file);
    products.push(product);
  }

  return products.sort((a, b) => a.name.localeCompare(b.name));
}

/** All products from the content directory, validated and sorted by name. */
export function getAllProducts(dir: string = CONTENT_DIR): Product[] {
  return loadProductsFrom(dir);
}

/** A single product by slug, or `null` if not found. */
export function getProductBySlug(
  slug: string,
  dir: string = CONTENT_DIR,
): Product | null {
  return getAllProducts(dir).find((p) => p.slug === slug) ?? null;
}
