import { test, expect } from "@playwright/test";

test("home page loads and shows the brand headline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tennessee Hiking Club/i);
  await expect(
    page.getByRole("heading", { name: /Explore Tennessee\. Together\./i }),
  ).toBeVisible();
});
