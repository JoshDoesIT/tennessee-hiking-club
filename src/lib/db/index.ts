import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

/**
 * Lazily-created Drizzle client over Neon's HTTP driver. Created on first use
 * (not at import) so the module is safe to import anywhere, including builds
 * where `DATABASE_URL` is not present.
 */
export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set; cannot connect to the database.");
  }
  if (!cached) {
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}
