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

test("contribute page links the new-trail form and contributing guide", async ({
  page,
}) => {
  await page.goto("/contribute");
  await expect(
    page.getByRole("link", { name: /new-trail form/i }),
  ).toHaveAttribute("href", /\/issues\/new\?template=new_trail\.yml$/);
  await expect(
    page.getByRole("link", { name: /contributing guide/i }),
  ).toHaveAttribute("href", /CONTRIBUTING\.md$/);
});
