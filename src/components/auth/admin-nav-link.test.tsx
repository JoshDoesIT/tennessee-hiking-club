import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminNavLink } from "./admin-nav-link";
import { useIsNative } from "@/lib/use-is-native";
import { API_ORIGIN } from "@/lib/api-origin";

vi.mock("@/lib/use-is-native", () => ({ useIsNative: vi.fn(() => false) }));

const browserOpen = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@capacitor/browser", () => ({ Browser: { open: browserOpen } }));

function mockStatus(body: { isAdmin?: boolean } | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        (body === null
          ? { ok: false, json: async () => ({}) }
          : { ok: true, json: async () => body }) as unknown as Response,
    ),
  );
}

beforeEach(() => {
  vi.mocked(useIsNative).mockReturnValue(false);
  browserOpen.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe("AdminNavLink", () => {
  it("renders nothing for non-admins", async () => {
    mockStatus({ isAdmin: false });
    const { container } = render(<AdminNavLink />);
    await new Promise((r) => setTimeout(r));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the review-queue link for an admin on the web", async () => {
    mockStatus({ isAdmin: true });
    render(<AdminNavLink />);
    const link = await screen.findByRole("link", { name: /review queue/i });
    expect(link).toHaveAttribute("href", "/admin/submissions");
  });

  it("opens the web review queue in the system browser on native", async () => {
    // The admin pages are excluded from the native bundle, so an in-bundle link
    // to /admin/submissions dead-ends on the home page. In the app the control
    // must open the production review queue in the system browser instead.
    vi.mocked(useIsNative).mockReturnValue(true);
    mockStatus({ isAdmin: true });
    render(<AdminNavLink />);

    const control = await screen.findByRole("button", { name: /review queue/i });
    expect(screen.queryByRole("link", { name: /review queue/i })).toBeNull();

    fireEvent.click(control);
    await waitFor(() =>
      expect(browserOpen).toHaveBeenCalledWith({
        url: `${API_ORIGIN}/admin/submissions`,
      }),
    );
  });

  it("closes the menu via onNavigate when opening the queue on native", async () => {
    vi.mocked(useIsNative).mockReturnValue(true);
    mockStatus({ isAdmin: true });
    const onNavigate = vi.fn();
    render(<AdminNavLink onNavigate={onNavigate} />);

    const control = await screen.findByRole("button", { name: /review queue/i });
    fireEvent.click(control);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
