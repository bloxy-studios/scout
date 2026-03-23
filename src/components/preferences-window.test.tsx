import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const PREFERENCES_TEST_TIMEOUT_MS = 15_000;

const mockInvoke = vi.fn();
const mockGetCurrentWebviewWindow = vi.fn(() => ({
  label: "preferences",
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => mockGetCurrentWebviewWindow(),
}));

vi.mock("./notch-widget", () => ({
  NotchWidget: () => <div data-testid="notch-widget">Notch</div>,
}));

describe("PreferencesWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockImplementation(async (command: string) => {
      if (command === "get_shortcut_settings") {
        return {
          enabled: false,
          accelerator: null,
          hasCompletedSetup: false,
        };
      }

      if (command === "save_shortcut_settings") {
        return {
          enabled: true,
          accelerator: "Alt+Shift+Space",
          hasCompletedSetup: true,
        };
      }

      return null;
    });
  });

  it("renders first-run setup in the preferences window", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Set Up Scout Shortcut" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Activation Shortcut")).toBeInTheDocument();
    expect(
      screen.getByText("Works globally, even when Scout is in the background."),
    ).toBeInTheDocument();
    expect(screen.getByText("No shortcut set")).toBeInTheDocument();
  }, PREFERENCES_TEST_TIMEOUT_MS);

  it("captures a shortcut candidate and saves it", async () => {
    render(<App />);

    const recordButton = await screen.findByRole("button", {
      name: "Record shortcut",
    });

    fireEvent.click(recordButton);
    expect(screen.getByText("Press shortcut…")).toBeInTheDocument();

    fireEvent.keyDown(recordButton, {
      key: " ",
      code: "Space",
      altKey: true,
      shiftKey: true,
    });

    expect(screen.getByText("⌥⇧Space")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("save_shortcut_settings", {
        settings: {
          enabled: true,
          accelerator: "Alt+Shift+Space",
          hasCompletedSetup: true,
        },
      });
    });
  }, PREFERENCES_TEST_TIMEOUT_MS);

  it("shows inline validation for reserved macOS shortcuts", async () => {
    render(<App />);

    const recordButton = await screen.findByRole("button", {
      name: "Record shortcut",
    });

    fireEvent.click(recordButton);
    fireEvent.keyDown(recordButton, {
      key: " ",
      code: "Space",
      metaKey: true,
    });

    expect(
      await screen.findByText(
        "That shortcut is reserved by macOS. Try another combination.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  }, PREFERENCES_TEST_TIMEOUT_MS);

  it("restores the saved shortcut instead of deleting it", async () => {
    mockInvoke.mockImplementation(async (command: string) => {
      if (command === "get_shortcut_settings") {
        return {
          enabled: true,
          accelerator: "Alt+Space",
          hasCompletedSetup: true,
        };
      }

      return null;
    });

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Keyboard Shortcut" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("⌥Space")).toBeInTheDocument();

    const recordButton = screen.getByRole("button", {
      name: "Record shortcut",
    });

    fireEvent.click(recordButton);
    fireEvent.keyDown(recordButton, {
      key: " ",
      code: "Space",
      altKey: true,
      shiftKey: true,
    });

    expect(screen.getByText("⌥⇧Space")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Revert" }));

    expect(await screen.findByText("⌥Space")).toBeInTheDocument();
    expect(mockInvoke).not.toHaveBeenCalledWith("save_shortcut_settings", expect.anything());
  }, PREFERENCES_TEST_TIMEOUT_MS);

  it("shows a native save error without clearing the draft shortcut", async () => {
    mockInvoke.mockImplementation(async (command: string) => {
      if (command === "get_shortcut_settings") {
        return {
          enabled: true,
          accelerator: "Alt+Space",
          hasCompletedSetup: true,
        };
      }

      if (command === "save_shortcut_settings") {
        throw new Error(
          "That shortcut is not available on this Mac. Try another combination.",
        );
      }

      return null;
    });

    render(<App />);

    expect(await screen.findByText("⌥Space")).toBeInTheDocument();

    const recordButton = screen.getByRole("button", {
      name: "Record shortcut",
    });

    fireEvent.click(recordButton);
    fireEvent.keyDown(recordButton, {
      key: " ",
      code: "Space",
      altKey: true,
      shiftKey: true,
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "That shortcut is not available on this Mac. Try another combination.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("⌥⇧Space")).toBeInTheDocument();
  }, PREFERENCES_TEST_TIMEOUT_MS);

  it("captures a shortcut after the field enters recording mode", async () => {
    render(<App />);

    const recordButton = await screen.findByRole("button", {
      name: "Record shortcut",
    });

    fireEvent.click(recordButton);
    expect(screen.getByText("Press shortcut…")).toBeInTheDocument();

    fireEvent.keyDown(recordButton, {
      key: "k",
      code: "KeyK",
      metaKey: true,
      altKey: true,
    });

    expect(screen.getByText("⌘⌥K")).toBeInTheDocument();
  }, PREFERENCES_TEST_TIMEOUT_MS);
});
