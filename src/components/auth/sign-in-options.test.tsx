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

  it("calls signIn with the provider id and callback URL", async () => {
    const user = userEvent.setup();
    mockProviders({ github: { id: "github", name: "GitHub" } });
    render(<SignInOptions />);
    await user.click(
      await screen.findByRole("button", { name: /continue with github/i }),
    );
    expect(signInMock).toHaveBeenCalledWith("github", { callbackUrl: "/hikes" });
  });

  it("shows a message when no providers are configured", async () => {
    mockProviders({});
    render(<SignInOptions />);
    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
  });
});
