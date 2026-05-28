import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CleanupLog } from "./cleanup-log";
import { getCleanups } from "@/lib/stewardship/cleanups";

beforeEach(() => localStorage.clear());

describe("CleanupLog", () => {
  it("logs a cleanup and shows the running count", async () => {
    const user = userEvent.setup();
    render(<CleanupLog />);

    await user.click(screen.getByRole("button", { name: /log a cleanup/i }));

    expect(screen.getByText(/1 cleanup/i)).toBeInTheDocument();
    expect(getCleanups()).toHaveLength(1);
  });
});
