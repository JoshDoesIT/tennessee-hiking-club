import { test, expect } from "@playwright/test";

test("trail detail shows parking info with a directions-to-parking link", async ({
  page,
}) => {
  await page.goto("/trails/virgin-falls");

  await expect(page.getByText(/free gravel lot at the trailhead/i)).toBeVisible();
  await expect(page.getByText(/access road is rough/i)).toBeVisible();

  const link = page.getByRole("link", { name: /directions to parking/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /maps\/dir/);
});
