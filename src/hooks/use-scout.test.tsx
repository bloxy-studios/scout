import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScout } from "./use-scout";

const mockParseScoutEnv = vi.fn((_env?: unknown) => ({
  elevenLabs: {
    agentId: "agent_test",
    serverLocation: "us" as const,
  },
  picovoice: {
    accessKey: "pv_test",
    keyword: {
      publicPath: "/picovoice/hey-scout.ppn",
      label: "Hey Scout",
    },
    model: {
      publicPath: "/picovoice/porcupine_params.pv",
    },
  },
}));

const mockUsePorcupineWakeWord = vi.fn();
const mockListen = vi.fn(async (_event: string, _handler: (payload?: unknown) => void) =>
  () => undefined);
const mockInvoke = vi.fn();

type MockConversation = {
  status: "connected" | "connecting" | "disconnected";
  startSession: ReturnType<typeof vi.fn>;
  endSession: ReturnType<typeof vi.fn>;
  getInputVolume: ReturnType<typeof vi.fn>;
  getOutputVolume: ReturnType<typeof vi.fn>;
};

let mockConversation: MockConversation;
let lastConversationCallbacks: Record<string, ((...args: unknown[]) => void) | undefined> = {};
let registeredEventHandlers = new Map<string, () => void>();

vi.mock("../config/env", () => ({
  parseScoutEnv: (env: unknown) => mockParseScoutEnv(env),
}));

vi.mock("./use-porcupine-wake-word", () => ({
  usePorcupineWakeWord: (options: unknown) => mockUsePorcupineWakeWord(options),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, handler: () => void) => {
    registeredEventHandlers.set(event, handler);
    return mockListen(event, handler);
  },
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("@elevenlabs/react", () => ({
  useConversation: (callbacks: Record<string, unknown>) => {
    lastConversationCallbacks = callbacks as Record<
      string,
      ((...args: unknown[]) => void) | undefined
    >;

    return mockConversation;
  },
}));

describe("useScout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConversation = {
      status: "disconnected",
      startSession: vi.fn(async () => {
        mockConversation.status = "connected";
        return "session_id";
      }),
      endSession: vi.fn(async () => {
        mockConversation.status = "disconnected";
      }),
      getInputVolume: vi.fn(() => 0),
      getOutputVolume: vi.fn(() => 0),
    };
    lastConversationCallbacks = {};
    registeredEventHandlers = new Map();
    mockInvoke.mockResolvedValue(null);

    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: vi.fn() }],
        })),
      },
    });
  });

  it("returns to idle when the conversation disconnects after an active session", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });

    act(() => {
      mockConversation.status = "disconnected";
      lastConversationCallbacks.onDisconnect?.();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(false);
      expect(result.current.notchState).toBe("idle");
    });
  });

  it("returns to idle when the conversation status changes to disconnected", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });

    act(() => {
      mockConversation.status = "disconnected";
      lastConversationCallbacks.onStatusChange?.({
        status: "disconnected",
      });
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(false);
      expect(result.current.notchState).toBe("idle");
    });
  });

  it("activates from idle when the native toggle event fires", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      registeredEventHandlers.get("scout://toggle-requested")?.();
    });

    await waitFor(() => {
      expect(mockConversation.startSession).toHaveBeenCalledTimes(1);
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });
  });

  it("hard-stops and returns to idle when the native toggle event fires during an active session", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });

    await act(async () => {
      registeredEventHandlers.get("scout://toggle-requested")?.();
    });

    await waitFor(() => {
      expect(mockConversation.endSession).toHaveBeenCalledTimes(1);
      expect(result.current.state.sessionActive).toBe(false);
      expect(result.current.notchState).toBe("idle");
    });
  });

  it("ignores a stale disconnected status if the conversation is still active", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });

    act(() => {
      mockConversation.status = "connected";
      lastConversationCallbacks.onStatusChange?.({
        status: "disconnected",
      });
    });

    act(() => {
      lastConversationCallbacks.onModeChange?.({
        mode: "speaking",
      });
    });

    expect(result.current.state.sessionActive).toBe(true);
    expect(result.current.notchState).toBe("speaking");
  });

  it("does not fall back to idle during the first activation if a stale disconnect arrives before connect settles", async () => {
    vi.useFakeTimers();
    mockConversation.startSession = vi.fn(
      async () =>
        await new Promise((resolve) => {
          window.setTimeout(() => {
            mockConversation.status = "connected";
            resolve("session_id");
          }, 200);
        }),
    );

    const { result } = renderHook(() => useScout());

    const activationPromise = act(async () => {
      const start = result.current.activateScout();
      await Promise.resolve();

      lastConversationCallbacks.onStatusChange?.({
        status: "disconnected",
      });

      vi.advanceTimersByTime(250);
      await start;
    });

    await activationPromise;

    expect(result.current.state.sessionActive).toBe(true);
    expect(result.current.notchState).toBe("listening");

    vi.useRealTimers();
  });


  it("activates from idle when the menu start event fires", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      registeredEventHandlers.get("scout://start-requested")?.();
    });

    await waitFor(() => {
      expect(mockConversation.startSession).toHaveBeenCalledTimes(1);
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });
  });

  it("ends the current session when the menu end event fires", async () => {
    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(result.current.state.sessionActive).toBe(true);
      expect(result.current.notchState).toBe("listening");
    });

    await act(async () => {
      registeredEventHandlers.get("scout://end-requested")?.();
    });

    await waitFor(() => {
      expect(mockConversation.endSession).toHaveBeenCalledTimes(1);
      expect(result.current.state.sessionActive).toBe(false);
      expect(result.current.notchState).toBe("idle");
    });
  });

  it("reports Scout activity changes to the native menu layer", async () => {
    renderHook(() => useScout());

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("set_scout_activity_state", {
        active: false,
      });
    });

    const { result } = renderHook(() => useScout());

    await act(async () => {
      await result.current.activateScout();
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("set_scout_activity_state", {
        active: true,
      });
    });

    act(() => {
      mockConversation.status = "disconnected";
      lastConversationCallbacks.onDisconnect?.();
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("set_scout_activity_state", {
        active: false,
      });
    });
  });
});
