import { test, expect } from "@playwright/test";

/**
 * Production smoke suite. Brief sanity checks against the live deploy: each
 * critical path returns a 200, renders its headline content, and emits the
 * Open Graph metadata that share previews depend on. Designed to be fast
 * (under a minute) and stable, so it can run on every schedule and catch
 * deploy regressions early.
 */

test("home loads and shows the club name", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: /tennessee hiking club/i }).first(),
  ).toBeVisible();
});

test("trails directory loads and lists trails", async ({ page }) => {
  const res = await page.goto("/trails");
  expect(res?.status()).toBe(200);
  await expect(
    page
      .locator('section[aria-label="Trail results"] a[href^="/trails/"]')
      .first(),
  ).toBeVisible();
});

test("leaderboard loads", async ({ page }) => {
  const res = await page.goto("/leaderboard");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: /leaderboard/i }),
  ).toBeVisible();
});

test("trail detail page loads", async ({ page }) => {
  const res = await page.goto("/trails/mt-leconte-alum-cave");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: /mount leconte/i }),
  ).toBeVisible();
});

test("privacy page loads", async ({ page }) => {
  const res = await page.goto("/privacy");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: /privacy/i }),
  ).toBeVisible();
});

test("accessibility page loads", async ({ page }) => {
  const res = await page.goto("/accessibility");
  expect(res?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: /accessibility/i }),
  ).toBeVisible();
});

test("home page emits per-page Open Graph metadata", async ({ page }) => {
  await page.goto("/");
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  const ogUrl = await page
    .locator('meta[property="og:url"]')
    .getAttribute("content");
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const ogAlt = await page
    .locator('meta[property="og:image:alt"]')
    .getAttribute("content");
  expect(ogTitle).toBe("Tennessee Hiking Club");
  expect(ogUrl).toContain("tnhiking.club");
  expect(ogImage).toContain("opengraph-image.png");
  expect(ogAlt).toMatch(/Tennessee Hiking Club/);
});

test("leaderboard emits its own Open Graph title and url", async ({ page }) => {
  await page.goto("/leaderboard");
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  const ogUrl = await page
    .locator('meta[property="og:url"]')
    .getAttribute("content");
  expect(ogTitle).toBe("Leaderboard");
  expect(ogUrl).toContain("/leaderboard");
});

test("custom 404 page is served and branded", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: /trailhead not found/i }),
  ).toBeVisible();
});
