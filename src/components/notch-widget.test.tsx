import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScout } from "../hooks/use-scout";
import { NotchWidget } from "./notch-widget";

vi.mock("../hooks/use-scout", () => ({
  useScout: vi.fn(),
}));

vi.mock("../lib/window-interactivity", () => ({
  setWindowInteractivity: vi.fn(() => Promise.resolve()),
}));

const mockedUseScout = vi.mocked(useScout);

function mockScoutState(notchState: ReturnType<typeof useScout>["notchState"]) {
  mockedUseScout.mockReturnValue({
    state: {
      notchState,
      sessionActive: notchState !== "idle",
      errorMessage: notchState === "error" ? "Scout hit an unexpected error." : null,
    },
    notchState,
    audioLevel: 0.4,
    activateScout: vi.fn(async () => undefined),
  });
}

describe("NotchWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a static scout badge in idle", () => {
    mockScoutState("idle");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
    expect(screen.queryByTestId("voice-waveform")).not.toBeInTheDocument();
  });

  it("renders the animated scout logo and waveform while listening", () => {
    mockScoutState("listening");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-logo-animated")).toBeInTheDocument();
    expect(screen.getByTestId("voice-waveform")).toBeInTheDocument();
  });

  it("renders the animated scout logo and waveform while speaking", () => {
    mockScoutState("speaking");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-logo-animated")).toBeInTheDocument();
    expect(screen.getByTestId("voice-waveform")).toBeInTheDocument();
  });

  it("keeps the processing state quieter than voice states", () => {
    mockScoutState("processing");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
  });

  it("keeps the searching state quieter than voice states", () => {
    mockScoutState("searching");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.getByText("Searching the web…")).toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
  });
});
