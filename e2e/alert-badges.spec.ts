import { test, expect } from "@playwright/test";

test("the trail directory shows an alert badge on a trail that has one", async ({
  page,
}) => {
  await page.goto("/trails");

  // Virgin Falls carries a caution alert, so its card shows a Caution badge.
  const card = page.locator('a[href="/trails/virgin-falls"]').first();
  await expect(card).toBeVisible();
  await expect(card).toContainText(/caution/i);
});
