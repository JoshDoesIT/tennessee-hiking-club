import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkHiked } from "./mark-hiked";
import { isHiked, readLog } from "@/lib/hikes/local-log";

beforeEach(() => localStorage.clear());

describe("MarkHiked", () => {
  it("toggles hiked state and persists it locally", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    const button = await screen.findByRole("button", {
      name: /mark as hiked/i,
    });
    expect(isHiked("radnor-lake")).toBe(false);

    await user.click(button);
    expect(isHiked("radnor-lake")).toBe(true);
    const pressed = screen.getByRole("button", { name: /hiked/i });
    expect(pressed).toHaveAttribute("aria-pressed", "true");

    await user.click(pressed);
    expect(isHiked("radnor-lake")).toBe(false);
  });

  it("logs an optional note and conditions when provided", async () => {
    const user = userEvent.setup();
    render(<MarkHiked slug="radnor-lake" />);

    await user.click(
      screen.getByRole("button", { name: /add a note or conditions/i }),
    );
    await user.selectOptions(screen.getByLabelText(/conditions/i), "Muddy");
    await user.type(screen.getByLabelText(/note/i), "spring wildflowers");
    await user.click(screen.getByRole("button", { name: /mark as hiked/i }));

    const entry = readLog().find((e) => e.trailSlug === "radnor-lake");
    expect(entry).toMatchObject({
      conditions: "Muddy",
      note: "spring wildflowers",
    });
  });
});
