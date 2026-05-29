import { test, expect } from "@playwright/test";

test("the contributors page lists a credited contributor", async ({ page }) => {
  await page.goto("/contributors");
  await expect(
    page.getByRole("heading", { level: 1, name: /contributors/i }),
  ).toBeVisible();
  await expect(page.getByText("@JoshDoesIT")).toBeVisible();
});

test("the leaderboard offers the contribution boards", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("link", { name: /trails contributed/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /conditions reported/i }),
  ).toBeVisible();
});
