import { defineConfig, devices } from "@playwright/test";

/**
 * Production smoke suite. Runs against the live deployed URL (no local web
 * server), so it can confirm a fresh `main` deploy is actually serving and
 * has not regressed the critical paths. Triggered on a schedule and on
 * demand via `pnpm test:smoke`.
 *
 * Override the target with `SMOKE_BASE_URL=...` for a Vercel preview or a
 * staging environment.
 */
const baseURL = process.env.SMOKE_BASE_URL ?? "https://www.tnhiking.club";

export default defineConfig({
  testDir: "./e2e/smoke",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Intentionally no webServer: we test the live deploy, not a local build.
});
