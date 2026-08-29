import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// next-auth's WebAuthn sign-in is dynamically imported in the click handler so
// @simplewebauthn/browser stays out of the initial bundle; the mock intercepts
// that dynamic import too.
vi.mock("next-auth/webauthn", () => ({ signIn: vi.fn() }));
import { signIn } from "next-auth/webauthn";
import { PasskeyButton } from "./passkey-button";

const signInMock = vi.mocked(signIn);

afterEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error test cleanup of the feature-detection global
  delete window.PublicKeyCredential;
});

function enableWebAuthn() {
  // @ts-expect-error minimal stub for feature detection
  window.PublicKeyCredential = function () {};
}

describe("PasskeyButton", () => {
  it("renders nothing where WebAuthn is unsupported (graceful degradation)", () => {
    const { container } = render(<PasskeyButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a labelled passkey button with the passkey icon when supported", async () => {
    enableWebAuthn();
    render(<PasskeyButton label="Sign in with a passkey" />);
    const btn = await screen.findByRole("button", {
      name: /sign in with a passkey/i,
    });
    expect(btn.querySelector('[data-icon="passkey"]')).not.toBeNull();
  });

  it("authenticates by default, passing an explicit action", async () => {
    enableWebAuthn();
    const user = userEvent.setup();
    render(
      <PasskeyButton label="Sign in with a passkey" callbackUrl="/hikes" />,
    );
    await user.click(await screen.findByRole("button", { name: /passkey/i }));
    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith("passkey", {
        action: "authenticate",
        callbackUrl: "/hikes",
      }),
    );
  });

  it("registers when action=register (logged-in users need an explicit action)", async () => {
    enableWebAuthn();
    const user = userEvent.setup();
    render(
      <PasskeyButton
        action="register"
        label="Add a passkey"
        callbackUrl="/hikes"
      />,
    );
    await user.click(await screen.findByRole("button", { name: /passkey/i }));
    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith("passkey", {
        action: "register",
        callbackUrl: "/hikes",
      }),
    );
  });
});
