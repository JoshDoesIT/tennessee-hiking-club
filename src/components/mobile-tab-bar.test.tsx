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
    for (const label of ["My Hikes", "Trails", "Map", "Record", "More"]) {
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

  // The Capacitor static export sets `trailingSlash: true`, so in the app
  // usePathname() returns e.g. "/explore/". Every tab must still light up, not
  // just Trails (whose startsWith matcher happened to tolerate the slash).
  it.each([
    ["/hikes/", "My Hikes"],
    ["/explore/", "Map"],
    ["/record/", "Record"],
    ["/more/", "More"],
    ["/trails/", "Trails"],
    ["/trails/mount-leconte/", "Trails"],
  ])("marks %s as the %s tab with a trailing slash", async (path, label) => {
    isNativePlatform.mockReturnValue(true);
    pathname.mockReturnValue(path);
    render(<MobileTabBar />);

    const active = await screen.findByRole("link", {
      name: new RegExp(label, "i"),
    });
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing on the web", async () => {
    isNativePlatform.mockReturnValue(false);
    const { container } = render(<MobileTabBar />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container).toBeEmptyDOMElement();
  });
});
