import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RecordingIndicator } from "./recording-indicator";
import {
  startRecording,
  pauseRecording,
  discardRecording,
} from "@/lib/hikes/recording-store";

beforeEach(() => {
  localStorage.clear();
  discardRecording();
});

describe("RecordingIndicator", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<RecordingIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a recording pill that links back to the trail", () => {
    act(() => startRecording("abrams-falls", "Abrams Falls"));
    render(<RecordingIndicator />);
    const link = screen.getByRole("link", {
      name: /recording hike on abrams falls/i,
    });
    expect(link).toHaveAttribute("href", "/trails/abrams-falls");
    expect(screen.getByText(/recording · abrams falls/i)).toBeInTheDocument();
  });

  it("shows a paused state", () => {
    act(() => {
      startRecording("abrams-falls", "Abrams Falls");
      pauseRecording();
    });
    render(<RecordingIndicator />);
    expect(screen.getByText(/paused · abrams falls/i)).toBeInTheDocument();
  });
});
