import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "./site-header";

const toggle = () => screen.getByRole("button", { name: /menu/i });

describe("SiteHeader mobile menu", () => {
  it("is collapsed by default", () => {
    render(<SiteHeader />);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", { name: /mobile/i }),
    ).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    await user.keyboard("{Escape}");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
  });

  it("closes when a menu link is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(toggle());
    const menu = screen.getByRole("navigation", { name: /mobile/i });
    await user.click(within(menu).getByRole("link", { name: "Trails" }));
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("reaches the map via one Open the map link, with no separate Explore item", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    expect(screen.queryByRole("link", { name: "Explore" })).toBeNull();

    await user.click(toggle());
    const menu = screen.getByRole("navigation", { name: /mobile/i });
    expect(
      within(menu).getByRole("link", { name: /open the map/i }),
    ).toHaveAttribute("href", "/explore");
  });
});
