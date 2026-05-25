import { test, expect } from "@playwright/test";

test("home page loads and shows the club name", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tennessee Hiking Club/i);
  await expect(
    page.getByRole("heading", { name: /Tennessee Hiking Club/i }),
  ).toBeVisible();
});
