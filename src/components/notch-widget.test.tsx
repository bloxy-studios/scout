import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScout } from "../hooks/use-scout";
import {
  setNotchWindowSize,
  setWindowInteractivity,
} from "../lib/window-interactivity";
import { NotchWidget } from "./notch-widget";

vi.mock("../hooks/use-scout", () => ({
  useScout: vi.fn(),
}));

vi.mock("../lib/window-interactivity", () => ({
  setWindowInteractivity: vi.fn(() => Promise.resolve()),
  setNotchWindowSize: vi.fn(() => Promise.resolve()),
}));

const mockedUseScout = vi.mocked(useScout);
const mockedSetNotchWindowSize = vi.mocked(setNotchWindowSize);
const mockedSetWindowInteractivity = vi.mocked(setWindowInteractivity);

function mockScoutState(notchState: ReturnType<typeof useScout>["notchState"]) {
  mockScoutStateWithSession(notchState, notchState !== "idle");
}

function mockScoutStateWithSession(
  notchState: ReturnType<typeof useScout>["notchState"],
  sessionActive: boolean,
) {
  mockedUseScout.mockReturnValue({
    state: {
      notchState,
      sessionActive,
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

  it("renders a static scout badge in idle", async () => {
    mockScoutState("idle");

    render(<NotchWidget />);

    expect(screen.getByTestId("notch-shell")).toBeInTheDocument();
    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
    expect(screen.queryByTestId("voice-waveform")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notch-rail")).not.toBeInTheDocument();
    expect(mockedSetNotchWindowSize).toHaveBeenCalledWith(132, 36);
  });

  it("renders the true idle notch when the session is inactive even if a stale active notch state remains", () => {
    mockScoutStateWithSession("listening", false);

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("notch-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("voice-waveform")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
    expect(mockedSetNotchWindowSize).toHaveBeenCalledWith(132, 36);
  });

  it("renders the animated scout logo and waveform while listening", () => {
    mockScoutState("listening");

    render(<NotchWidget />);

    expect(screen.getByTestId("notch-shell")).toBeInTheDocument();
    expect(screen.getByTestId("notch-rail")).toBeInTheDocument();
    expect(screen.getByTestId("voice-cluster")).toBeInTheDocument();
    expect(screen.getByTestId("scout-logo-animated")).toBeInTheDocument();
    expect(screen.getByTestId("voice-waveform")).toBeInTheDocument();
    expect(mockedSetNotchWindowSize).toHaveBeenCalledWith(290, 62);
  });

  it("renders the animated scout logo and waveform while speaking", () => {
    mockScoutState("speaking");

    render(<NotchWidget />);

    expect(screen.getByTestId("notch-shell")).toBeInTheDocument();
    expect(screen.getByTestId("notch-rail")).toBeInTheDocument();
    expect(screen.getByTestId("voice-cluster")).toBeInTheDocument();
    expect(screen.getByTestId("scout-logo-animated")).toBeInTheDocument();
    expect(screen.getByTestId("voice-waveform")).toBeInTheDocument();
    expect(mockedSetNotchWindowSize).toHaveBeenCalledWith(290, 62);
  });

  it("keeps the processing state quieter than voice states", () => {
    mockScoutState("processing");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.getByTestId("voice-waveform")).toBeInTheDocument();
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
  });

  it("keeps the searching state quieter than voice states", () => {
    mockScoutState("searching");

    render(<NotchWidget />);

    expect(screen.getByTestId("scout-badge")).toBeInTheDocument();
    expect(screen.getByText("Searching the web…")).toBeInTheDocument();
    expect(screen.queryByTestId("scout-logo-animated")).not.toBeInTheDocument();
    expect(mockedSetNotchWindowSize).toHaveBeenCalledWith(290, 62);
  });

  it("does not touch native interactivity until hover handlers run", () => {
    mockScoutState("idle");

    render(<NotchWidget />);

    expect(mockedSetWindowInteractivity).not.toHaveBeenCalled();
  });
});
