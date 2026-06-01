import { test, expect } from "@playwright/test";

/**
 * The service worker (#215) must register, take control, and serve an offline
 * fallback when a navigation is requested with no signal and nothing cached.
 * This is the core of the offline shell the Capacitor app depends on.
 */
test("registers a service worker and serves an offline fallback", async ({
  page,
  context,
}) => {
  await page.goto("/");

  // Wait for the service worker to install, activate, and claim the page.
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {
    timeout: 20_000,
  });

  await context.setOffline(true);
  try {
    // A route not yet cached, requested offline, falls back to the offline page.
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: /you are offline/i }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
