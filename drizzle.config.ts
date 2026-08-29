import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for generating and applying migrations. Migrations use the
 * unpooled connection; `pnpm db:generate` needs no database, `pnpm db:migrate`
 * reads the URL from the environment (e.g. `.env.local` via `vercel env pull`).
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
