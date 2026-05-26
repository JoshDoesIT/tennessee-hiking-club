import { test, expect } from "@playwright/test";

test("the shop lists products linking to their detail pages", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(
    page.getByRole("heading", { name: /shop the hiking club/i }),
  ).toBeVisible();
  const links = page.locator('main a[href^="/shop/"]');
  expect(await links.count()).toBeGreaterThanOrEqual(3);
});

test("a product page shows its price and variants", async ({ page }) => {
  await page.goto("/shop/trail-tee");
  await expect(page.getByRole("heading", { name: /trail tee/i })).toBeVisible();
  await expect(page.getByText("$24.00")).toBeVisible();
  await expect(page.getByLabel("Size")).toBeVisible();
  await expect(page.getByRole("button", { name: /buy now/i })).toBeVisible();
});

test("an unknown product slug returns 404", async ({ page }) => {
  const res = await page.goto("/shop/does-not-exist");
  expect(res?.status()).toBe(404);
});
