import { test, expect } from "@playwright/test";

test("home CTAs resolve to the right routes", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("#main-content");
  await expect(
    main.getByRole("link", { name: "Explore the map", exact: true }),
  ).toHaveAttribute("href", "/explore");
  await expect(
    main.getByRole("link", { name: "Browse trails", exact: true }),
  ).toHaveAttribute("href", "/trails");
  await expect(
    main.getByRole("link", { name: "Browse all trails", exact: true }),
  ).toHaveAttribute("href", "/trails");
  await expect(
    main.getByRole("link", { name: "Contribute a trail", exact: true }),
  ).toHaveAttribute("href", "/contribute");
});

test("home features real trails linking to their pages", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /few favorites/i }),
  ).toBeVisible();
  // The featured cards link to actual trail detail pages.
  const trailLink = page.locator('#main-content a[href^="/trails/"]').first();
  await expect(trailLink).toHaveAttribute("href", /^\/trails\/[a-z0-9-]+$/);
});

test("contribute page offers in-app submission and links GitHub paths", async ({
  page,
}) => {
  await page.goto("/contribute");
  // In-app submission is the primary path; signed-out visitors see a prompt to
  // sign in rather than the form.
  await expect(
    page.getByRole("heading", { level: 2, name: /suggest a trail/i }),
  ).toBeVisible();
  await expect(page.getByText(/sign in to suggest a trail/i)).toBeVisible();
  await expect(page.getByLabel(/trail name/i)).toHaveCount(0);
  // GitHub paths remain available.
  await expect(
    page.getByRole("link", { name: /new-trail issue form/i }),
  ).toHaveAttribute("href", /\/issues\/new\?template=new_trail\.yml$/);
  await expect(
    page.getByRole("link", { name: /contributing guide/i }),
  ).toHaveAttribute("href", /CONTRIBUTING\.md$/);
});
