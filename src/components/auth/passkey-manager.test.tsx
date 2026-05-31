import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasskeyManager } from "./passkey-manager";

function mockCount(count: number | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        (count === null
          ? { ok: false, json: async () => ({}) }
          : { ok: true, json: async () => ({ count }) }) as unknown as Response,
    ),
  );
}

function enableWebAuthn() {
  // @ts-expect-error minimal stub for feature detection
  window.PublicKeyCredential = function () {};
}

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error cleanup of the feature-detection global
  delete window.PublicKeyCredential;
});

describe("PasskeyManager", () => {
  it("renders nothing where WebAuthn is unsupported", () => {
    mockCount(0);
    const { container } = render(<PasskeyManager />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers to add a passkey when none are registered", async () => {
    enableWebAuthn();
    mockCount(0);
    render(<PasskeyManager />);
    expect(
      await screen.findByRole("heading", { name: /passkeys/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^add a passkey$/i }),
    ).toBeInTheDocument();
  });

  it("reflects an existing passkey and offers to add another", async () => {
    enableWebAuthn();
    mockCount(2);
    render(<PasskeyManager />);
    expect(
      await screen.findByRole("button", { name: /add another passkey/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 passkeys/i)).toBeInTheDocument();
  });
});
