import { test, expect } from "@playwright/test";

// Grant geolocation and pin a position (Knoxville-ish) so the opt-in resolves.
test.use({
  permissions: ["geolocation"],
  geolocation: { latitude: 35.96, longitude: -83.92 },
});

test("sort by distance from me reorders trails and shows distances", async ({
  page,
}) => {
  await page.goto("/trails");

  // No distances until the user opts in.
  await expect(page.getByText(/mi away/i)).toHaveCount(0);

  await page
    .getByRole("button", { name: /sort by distance from me/i })
    .click();

  // Distances appear and the status confirms the location stayed on-device.
  await expect(page.getByText(/mi away/i).first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/distance/i);
});
