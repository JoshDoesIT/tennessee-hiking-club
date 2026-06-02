import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
import { signIn } from "next-auth/react";
import { SignInOptions } from "./sign-in-options";

const signInMock = vi.mocked(signIn);

function mockProviders(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => data }) as unknown as Response),
  );
}

beforeEach(() => signInMock.mockClear());
afterEach(() => vi.unstubAllGlobals());

describe("SignInOptions", () => {
  it("renders a button per configured provider", async () => {
    mockProviders({
      github: { id: "github", name: "GitHub" },
      google: { id: "google", name: "Google" },
    });
    render(<SignInOptions />);
    expect(
      await screen.findByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("renders the Facebook button with its brand icon when configured", async () => {
    mockProviders({ facebook: { id: "facebook", name: "Facebook" } });
    const { container } = render(<SignInOptions />);
    expect(
      await screen.findByRole("button", { name: /continue with facebook/i }),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-icon="facebook"]')).not.toBeNull();
  });

  it("calls signIn with the provider id and callback URL", async () => {
    const user = userEvent.setup();
    mockProviders({ github: { id: "github", name: "GitHub" } });
    render(<SignInOptions />);
    await user.click(
      await screen.findByRole("button", { name: /continue with github/i }),
    );
    expect(signInMock).toHaveBeenCalledWith("github", { callbackUrl: "/hikes" });
  });

  it("shows a recognizable, decorative icon on each provider button", async () => {
    mockProviders({
      github: { id: "github", name: "GitHub" },
      google: { id: "google", name: "Google" },
    });
    const { container } = render(<SignInOptions />);
    await screen.findByRole("button", { name: /continue with github/i });

    const githubIcon = container.querySelector('[data-icon="github"]');
    const googleIcon = container.querySelector('[data-icon="google"]');
    expect(githubIcon).not.toBeNull();
    expect(googleIcon).not.toBeNull();
    // Decorative: the visible text stays the accessible label.
    expect(githubIcon).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a generic icon for an unknown provider", async () => {
    mockProviders({ acme: { id: "acme", name: "Acme SSO" } });
    const { container } = render(<SignInOptions />);
    await screen.findByRole("button", { name: /continue with acme sso/i });
    expect(container.querySelector('[data-icon="fallback"]')).not.toBeNull();
  });

  it("does not render WebAuthn providers as OAuth buttons (passkey has its own)", async () => {
    mockProviders({
      github: { id: "github", name: "GitHub", type: "oauth" },
      passkey: { id: "passkey", name: "Passkey", type: "webauthn" },
    });
    render(<SignInOptions />);
    await screen.findByRole("button", { name: /continue with github/i });
    expect(
      screen.queryByRole("button", { name: /continue with passkey/i }),
    ).toBeNull();
  });

  it("shows a message when no providers are configured", async () => {
    mockProviders({});
    render(<SignInOptions />);
    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
  });
});
