import { test, expect } from "@playwright/test";

// Trail-card links only (href has a slug); excludes the "Clear" link to /trails.
const results = (page: import("@playwright/test").Page) =>
  page.locator('section[aria-label="Trail results"] a[href^="/trails/"]');

test("filtering by region narrows the trail directory", async ({ page }) => {
  await page.goto("/trails");

  const total = await results(page).count();
  expect(total).toBeGreaterThan(3);

  // Apply a region filter via the no-JS GET form.
  await page.getByLabel("Region").selectOption("East");
  await page.getByRole("button", { name: /apply filters/i }).click();

  // Filter is reflected in the URL (shareable) and the list is narrowed.
  await expect(page).toHaveURL(/region=East/);
  // Wait for the navigated, server-filtered list to render before counting:
  // count() does not auto-retry, so gate it on a web-first assertion.
  await expect(results(page).first()).toBeVisible();
  const filtered = await results(page).count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(total);
});

test("a shareable filter URL renders narrowed results on the server", async ({
  page,
}) => {
  await page.goto("/trails?difficulty=easy");
  await expect(
    page.getByRole("region", { name: "Trail results" }),
  ).toBeVisible();
  // The directory loads pre-filtered straight from the URL, no interaction.
  expect(await results(page).count()).toBeGreaterThan(0);
});

test("searching by name narrows the directory and is shareable", async ({
  page,
}) => {
  await page.goto("/trails");
  const total = await results(page).count();

  await page.getByLabel("Search by name").fill("falls");
  await page.getByRole("button", { name: /apply filters/i }).click();

  await expect(page).toHaveURL(/q=falls/);
  await expect(results(page).first()).toBeVisible();
  const filtered = await results(page).count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(total);
});

test("a shareable search URL renders matching trails on the server", async ({
  page,
}) => {
  await page.goto("/trails?q=virgin");
  await expect(page.getByRole("link", { name: /virgin falls/i })).toBeVisible();
  expect(await results(page).count()).toBe(1);
});

test("filtering to dog-friendly narrows the directory and is shareable", async ({
  page,
}) => {
  await page.goto("/trails");
  const total = await results(page).count();

  await page.getByLabel(/dog-friendly only/i).check();
  await page.getByRole("button", { name: /apply filters/i }).click();

  await expect(page).toHaveURL(/dog=1/);
  await expect(results(page).first()).toBeVisible();
  const filtered = await results(page).count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(total);
});

test("filtering to kid-friendly narrows to the easy family trails", async ({
  page,
}) => {
  await page.goto("/trails");
  const total = await results(page).count();

  await page.getByLabel(/kid-friendly only/i).check();
  await page.getByRole("button", { name: /apply filters/i }).click();

  await expect(page).toHaveURL(/kid=1/);
  // Radnor Lake is flagged kid-friendly; Mount LeConte (strenuous) is not.
  await expect(page.getByRole("link", { name: /radnor lake/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /mount leconte/i })).toHaveCount(
    0,
  );
  expect(await results(page).count()).toBeLessThan(total);
});

test("shows an empty state when no trails match", async ({ page }) => {
  // West has no "hard" trails, so this combination is always empty.
  await page.goto("/trails?region=West&difficulty=hard");

  expect(await results(page).count()).toBe(0);
  await expect(page.getByText(/no trails match/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /clear filters/i }),
  ).toBeVisible();
});
