import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasskeyManager } from "./passkey-manager";

afterEach(() => {
  // @ts-expect-error test cleanup of the feature-detection global
  delete window.PublicKeyCredential;
});

describe("PasskeyManager", () => {
  it("renders nothing where WebAuthn is unsupported", () => {
    const { container } = render(<PasskeyManager />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a passkey to register when WebAuthn is supported", async () => {
    // @ts-expect-error minimal stub for feature detection
    window.PublicKeyCredential = function () {};
    render(<PasskeyManager />);
    expect(
      await screen.findByRole("heading", { name: /passkeys/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add a passkey/i }),
    ).toBeInTheDocument();
  });
});
