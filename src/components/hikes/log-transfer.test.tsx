import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogTransfer } from "./log-transfer";
import { exportLogJson } from "@/lib/hikes/transfer";
import { readLog } from "@/lib/hikes/local-log";
import type { Trail } from "@/lib/trails/schema";

const trails: Trail[] = [];

beforeEach(() => localStorage.clear());

describe("LogTransfer", () => {
  it("renders export and import controls", () => {
    render(<LogTransfer trails={trails} />);
    expect(
      screen.getByRole("button", { name: /export json/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /gpx/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/import/i)).toBeInTheDocument();
  });

  it("imports a JSON file and reports the result", async () => {
    const user = userEvent.setup();
    render(<LogTransfer trails={trails} />);

    const json = exportLogJson([{ trailSlug: "a", hikedOn: "2026-01-01" }]);
    const file = new File([json], "hikes.json", { type: "application/json" });
    await user.upload(screen.getByLabelText(/import/i), file);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/1 hike/i),
    );
    expect(readLog()).toHaveLength(1);
  });

  it("reports an error for an unreadable file", async () => {
    const user = userEvent.setup();
    render(<LogTransfer trails={trails} />);

    const file = new File(["nonsense"], "bad.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText(/import/i), file);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/could not/i),
    );
    expect(readLog()).toHaveLength(0);
  });
});
