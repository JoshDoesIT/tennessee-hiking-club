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

test("the friends board is private: signed-out visitors see a sign-in prompt", async ({
  page,
}) => {
  await page.goto("/leaderboard");
  // Everyone / Friends scope toggle is offered.
  await expect(page.getByRole("link", { name: /^Friends$/ })).toBeVisible();

  await page.goto("/leaderboard?scope=friends");
  await expect(page.getByText(/sign in to see your friends/i)).toBeVisible();
});
