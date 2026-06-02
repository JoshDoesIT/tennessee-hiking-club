import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  registerForPushNotifications: vi.fn(),
  unsubscribeDevice: vi.fn(async () => true),
}));
vi.mock("@/lib/push/register", () => ({
  registerForPushNotifications: mocks.registerForPushNotifications,
  unsubscribeDevice: mocks.unsubscribeDevice,
}));

import { PushOptIn } from "./push-opt-in";
import { setPushPref, clearPushPref, readPushPref } from "@/lib/push/pref";

const switchEl = () => screen.getByRole("switch", { name: /trail alert/i });

beforeEach(() => {
  window.localStorage.clear();
  clearPushPref();
  vi.clearAllMocks();
});

describe("PushOptIn", () => {
  it("starts switched off", () => {
    render(<PushOptIn />);
    expect(switchEl()).toHaveAttribute("aria-checked", "false");
  });

  it("registers the device and remembers the opt-in when enabled", async () => {
    const user = userEvent.setup();
    mocks.registerForPushNotifications.mockResolvedValue({
      supported: true,
      status: "registered",
      token: "tok-9",
    });
    render(<PushOptIn />);

    await user.click(switchEl());

    expect(mocks.registerForPushNotifications).toHaveBeenCalled();
    expect(switchEl()).toHaveAttribute("aria-checked", "true");
    expect(readPushPref()).toEqual({ optedIn: true, token: "tok-9" });
  });

  it("points web users to the app and stays off when unsupported", async () => {
    const user = userEvent.setup();
    mocks.registerForPushNotifications.mockResolvedValue({
      supported: false,
      status: "unsupported",
    });
    render(<PushOptIn />);

    await user.click(switchEl());

    expect(await screen.findByText(/app on your phone/i)).toBeInTheDocument();
    expect(switchEl()).toHaveAttribute("aria-checked", "false");
    expect(readPushPref().optedIn).toBe(false);
  });

  it("unsubscribes and clears the opt-in when disabled", async () => {
    const user = userEvent.setup();
    setPushPref({ optedIn: true, token: "tok-9" });
    render(<PushOptIn />);
    expect(switchEl()).toHaveAttribute("aria-checked", "true");

    await user.click(switchEl());

    expect(mocks.unsubscribeDevice).toHaveBeenCalledWith("tok-9");
    expect(switchEl()).toHaveAttribute("aria-checked", "false");
    expect(readPushPref().optedIn).toBe(false);
  });
});
