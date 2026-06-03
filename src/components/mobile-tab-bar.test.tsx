import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const isNativePlatform = vi.hoisted(() => vi.fn(() => true));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform } }));

const pathname = vi.hoisted(() => vi.fn(() => "/hikes"));
vi.mock("next/navigation", () => ({ usePathname: pathname }));

import { MobileTabBar } from "./mobile-tab-bar";

afterEach(() => vi.clearAllMocks());

describe("MobileTabBar", () => {
  it("shows the four primary tabs in the native app", async () => {
    isNativePlatform.mockReturnValue(true);
    render(<MobileTabBar />);

    const nav = await screen.findByRole("navigation", { name: /primary/i });
    for (const label of ["My Hikes", "Trails", "Map", "Record"]) {
      expect(
        screen.getByRole("link", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }
    expect(nav).toBeInTheDocument();
  });

  it("marks the tab for the current route as current", async () => {
    isNativePlatform.mockReturnValue(true);
    pathname.mockReturnValue("/explore");
    render(<MobileTabBar />);

    const map = await screen.findByRole("link", { name: /map/i });
    expect(map).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /trails/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("treats a trail detail page as the Trails tab", async () => {
    isNativePlatform.mockReturnValue(true);
    pathname.mockReturnValue("/trails/mount-leconte");
    render(<MobileTabBar />);

    const trails = await screen.findByRole("link", { name: /trails/i });
    expect(trails).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing on the web", async () => {
    isNativePlatform.mockReturnValue(false);
    const { container } = render(<MobileTabBar />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container).toBeEmptyDOMElement();
  });
});
