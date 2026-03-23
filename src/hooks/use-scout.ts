import {
  useConversation,
  type HookCallbacks,
} from "@elevenlabs/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  useCallback,
  type Dispatch,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { parseScoutEnv } from "../config/env";
import {
  detectCloseIntent,
  extractTranscriptText,
} from "../lib/close-intent";
import {
  advanceConversationCompletion,
  clearConversationCloseRequest,
  createConversationCompletionState,
  requestConversationClose,
  shouldReturnToIdle,
  type ConversationConnectionStatus,
} from "../lib/conversation-completion";
import {
  createInitialScoutState,
  reduceScoutState,
  type NotchState,
  type ScoutState,
} from "../lib/scout-state";
import { usePorcupineWakeWord } from "./use-porcupine-wake-word";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Scout hit an unexpected error.";
}

function createMessageHandler(
  dispatch: Dispatch<Parameters<typeof reduceScoutState>[1]>,
  onExplicitCloseIntent: () => void,
  onContinuedConversation: () => void,
): NonNullable<HookCallbacks["onMessage"]> {
  return (event) => {
    if (event.source === "user") {
      dispatch({ type: "user-transcript-received" });

      const transcript = extractTranscriptText(event);

      if (detectCloseIntent(transcript)) {
        onExplicitCloseIntent();
      } else {
        onContinuedConversation();
      }
    }
  };
}

export type UseScoutResult = {
  state: ScoutState;
  notchState: NotchState;
  audioLevel: number;
  activateScout: () => Promise<void>;
};

export function useScout(): UseScoutResult {
  const DISCONNECT_VERIFICATION_MS = 120;
  const envResult = useMemo(() => {
    try {
      return {
        config: parseScoutEnv(import.meta.env),
        error: null,
      };
    } catch (error) {
      return {
        config: null,
        error: getErrorMessage(error),
      };
    }
  }, []);

  const [state, dispatch] = useReducer(
    reduceScoutState,
    createInitialScoutState(envResult.error ?? undefined),
  );
  const [wakeWordLevel, setWakeWordLevel] = useState(0);
  const [conversationLevel, setConversationLevel] = useState(0);
  const activationInFlightRef = useRef(false);
  const sessionStartingRef = useRef(false);
  const completionStateRef = useRef<ReturnType<typeof createConversationCompletionState> | null>(null);
  const sessionEndingRef = useRef(false);
  const sessionErroredRef = useRef(false);
  const disconnectVerificationTimerRef = useRef<number | null>(null);

  const clearPendingDisconnectVerification = useEffectEvent(() => {
    if (disconnectVerificationTimerRef.current !== null) {
      window.clearTimeout(disconnectVerificationTimerRef.current);
      disconnectVerificationTimerRef.current = null;
    }
  });

  const finalizeSession = useEffectEvent(() => {
    clearPendingDisconnectVerification();
    activationInFlightRef.current = false;
    sessionStartingRef.current = false;
    completionStateRef.current = null;
    sessionEndingRef.current = false;
    sessionErroredRef.current = false;
    dispatch({ type: "session-ended" });
  });

  const markExplicitCloseIntent = useEffectEvent(() => {
    const now = performance.now();
    const currentState =
      completionStateRef.current ?? createConversationCompletionState(now);

    completionStateRef.current = requestConversationClose(currentState, now);
  });

  const clearExplicitCloseIntent = useEffectEvent(() => {
    if (!completionStateRef.current) {
      return;
    }

    completionStateRef.current = clearConversationCloseRequest(
      completionStateRef.current,
    );
  });

  const confirmConversationDisconnected = useEffectEvent(() => {
    activationInFlightRef.current = false;
    completionStateRef.current = null;

    if (sessionErroredRef.current) {
      clearPendingDisconnectVerification();
      sessionEndingRef.current = false;
      sessionErroredRef.current = false;
      return;
    }

    if (sessionStartingRef.current && !sessionEndingRef.current) {
      return;
    }

    if (
      !sessionEndingRef.current &&
      conversation.status !== "disconnected"
    ) {
      return;
    }

    if (state.sessionActive || sessionEndingRef.current) {
      finalizeSession();
    }
  });

  const handleConversationDisconnected = useEffectEvent(() => {
    clearPendingDisconnectVerification();

    disconnectVerificationTimerRef.current = window.setTimeout(() => {
      disconnectVerificationTimerRef.current = null;
      confirmConversationDisconnected();
    }, DISCONNECT_VERIFICATION_MS);
  });

  const endConversationAndReturnIdle = useEffectEvent(async () => {
    if (sessionEndingRef.current) {
      return;
    }

    clearPendingDisconnectVerification();
    sessionEndingRef.current = true;
    activationInFlightRef.current = false;
    sessionStartingRef.current = false;

    try {
      if (
        conversation.status === "connected" ||
        conversation.status === "connecting"
      ) {
        await conversation.endSession();
        window.setTimeout(() => {
          if (sessionEndingRef.current) {
            finalizeSession();
          }
        }, 600);
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[Scout completion]", error);
      }
    }

    finalizeSession();
  });

  const conversation = useConversation({
    serverLocation: envResult.config?.elevenLabs.serverLocation,
    micMuted: state.notchState === "speaking",
    clientTools: {
      startSearchIndicator: () => {
        dispatch({ type: "search-started" });
        return "acknowledged";
      },
    },
    onDisconnect: handleConversationDisconnected,
    onError: (error) => {
      activationInFlightRef.current = false;
      sessionStartingRef.current = false;
      clearPendingDisconnectVerification();
      sessionErroredRef.current = true;
      completionStateRef.current = null;
      sessionEndingRef.current = false;
      dispatch({
        type: "session-error",
        message: getErrorMessage(error),
      });
    },
    onStatusChange: ({ status }) => {
      if (status === "disconnected") {
        handleConversationDisconnected();
        return;
      }

      sessionStartingRef.current = false;
      activationInFlightRef.current = false;
      clearPendingDisconnectVerification();
    },
    onMessage: createMessageHandler(
      dispatch,
      markExplicitCloseIntent,
      clearExplicitCloseIntent,
    ),
    onModeChange: ({ mode }) => {
      sessionStartingRef.current = false;
      activationInFlightRef.current = false;
      clearPendingDisconnectVerification();
      dispatch({
        type: "agent-mode-changed",
        mode,
      });
    },
  });

  const activateScout = useCallback(async () => {
    if (!envResult.config) {
      dispatch({
        type: "session-error",
        message: envResult.error ?? "Scout is missing required environment configuration.",
      });
      return;
    }

    if (
      activationInFlightRef.current ||
      conversation.status === "connected" ||
      conversation.status === "connecting"
    ) {
      return;
    }

    activationInFlightRef.current = true;
    sessionStartingRef.current = true;
    sessionEndingRef.current = false;
    sessionErroredRef.current = false;
    completionStateRef.current = createConversationCompletionState(
      performance.now(),
    );
    dispatch({ type: "activation-requested" });

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access is not available. Check that Scout has microphone permission in System Settings > Privacy & Security > Microphone.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      await conversation.startSession({
        agentId: envResult.config.elevenLabs.agentId,
        connectionType: "webrtc",
      });

      activationInFlightRef.current = false;
      sessionStartingRef.current = false;
    } catch (error) {
      activationInFlightRef.current = false;
      sessionStartingRef.current = false;
      dispatch({
        type: "session-error",
        message: getErrorMessage(error),
      });
    }
  }, [conversation, envResult.config, envResult.error]);

  usePorcupineWakeWord({
    config: envResult.config,
    isSessionActive: state.sessionActive || conversation.status !== "disconnected",
    onDetected: activateScout,
    onLevelChange: setWakeWordLevel,
    onError: (message) => {
      if (import.meta.env.DEV) {
        console.warn("[Scout wake word]", message);
      }
    },
  });

  const toggleScout = useEffectEvent(async () => {
    const isConversationActive =
      state.sessionActive || conversation.status !== "disconnected";

    if (isConversationActive) {
      await endConversationAndReturnIdle();
      return;
    }

    await activateScout();
  });

  const handleMenuStartRequested = useEffectEvent(async () => {
    await activateScout();
  });

  const handleMenuEndRequested = useEffectEvent(async () => {
    await endConversationAndReturnIdle();
  });

  useEffect(() => {
    let unlistenHandlers: Array<() => void> = [];

    void Promise.all([
      listen("scout://toggle-requested", () => {
        void toggleScout();
      }),
      listen("scout://start-requested", () => {
        void handleMenuStartRequested();
      }),
      listen("scout://end-requested", () => {
        void handleMenuEndRequested();
      }),
    ])
      .then((cleanups) => {
        unlistenHandlers = cleanups;
      })
      .catch(() => undefined);

    return () => {
      unlistenHandlers.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [handleMenuEndRequested, handleMenuStartRequested, toggleScout]);

  useEffect(() => {
    const active =
      state.sessionActive || conversation.status !== "disconnected";

    void invoke("set_scout_activity_state", { active }).catch(() => undefined);
  }, [conversation.status, state.sessionActive]);

  useEffect(() => {
    return () => {
      if (disconnectVerificationTimerRef.current !== null) {
        window.clearTimeout(disconnectVerificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let frameId = 0;

    const updateLevel = () => {
      const inputLevel = conversation.getInputVolume();
      const outputLevel = conversation.getOutputVolume();
      const nextLevel = state.notchState === "speaking" ? outputLevel : inputLevel;

      setConversationLevel(nextLevel);

      if (state.sessionActive) {
        const now = performance.now();
        const currentCompletionState =
          completionStateRef.current ?? createConversationCompletionState(now);
        const snapshot = {
          now,
          inputLevel,
          outputLevel,
          notchState: state.notchState,
          sessionActive: state.sessionActive,
          status: conversation.status as ConversationConnectionStatus,
        };
        const nextCompletionState = advanceConversationCompletion(
          currentCompletionState,
          snapshot,
        );

        completionStateRef.current = nextCompletionState;

        if (shouldReturnToIdle(nextCompletionState, snapshot)) {
          void endConversationAndReturnIdle();
          return;
        }
      } else {
        completionStateRef.current = null;
      }

      frameId = window.requestAnimationFrame(updateLevel);
    };

    frameId = window.requestAnimationFrame(updateLevel);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [conversation, endConversationAndReturnIdle, state.notchState, state.sessionActive]);

  return {
    state,
    notchState: state.notchState,
    audioLevel:
      state.sessionActive && state.notchState !== "idle"
        ? conversationLevel
        : wakeWordLevel,
    activateScout,
  };
}
