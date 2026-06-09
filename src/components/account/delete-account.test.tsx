import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const appSignOut = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/native-signout", () => ({ appSignOut }));

import { DeleteAccount } from "./delete-account";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("DeleteAccount", () => {
  it("hides the destructive action behind a confirmation", async () => {
    render(<DeleteAccount />);
    expect(
      screen.queryByRole("button", { name: /delete my account/i }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: /^delete account$/i }),
    );
    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("button", { name: /delete my account/i }),
    ).toBeNull();
  });

  it("deletes the account then signs out", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<DeleteAccount />);
    await userEvent.click(
      screen.getByRole("button", { name: /^delete account$/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /delete my account/i }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/account", {
        method: "DELETE",
      }),
    );
    expect(appSignOut).toHaveBeenCalled();
  });

  it("shows an error and does not sign out when the delete fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false }) as Response),
    );
    render(<DeleteAccount />);
    await userEvent.click(
      screen.getByRole("button", { name: /^delete account$/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /delete my account/i }),
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(appSignOut).not.toHaveBeenCalled();
  });
});
