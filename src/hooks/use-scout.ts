import {
  useConversation,
  type HookCallbacks,
} from "@elevenlabs/react";
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
  createInitialScoutState,
  reduceScoutState,
  type NotchState,
  type ScoutState,
} from "../lib/scout-state";
import { usePorcupineWakeWord } from "./use-porcupine-wake-word";

const IDLE_RETURN_DELAY_MS = 5_000;

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
): NonNullable<HookCallbacks["onMessage"]> {
  return (event) => {
    if (event.source === "user") {
      dispatch({ type: "user-transcript-received" });
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
  const idleTimerRef = useRef<number | null>(null);
  const activationInFlightRef = useRef(false);

  const clearIdleTimer = useEffectEvent(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  });

  const scheduleIdleReturn = useEffectEvent(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      dispatch({ type: "session-ended" });
    }, IDLE_RETURN_DELAY_MS);
  });

  const conversation = useConversation({
    serverLocation: envResult.config?.elevenLabs.serverLocation,
    clientTools: {
      startSearchIndicator: () => {
        dispatch({ type: "search-started" });
        return "acknowledged";
      },
    },
    onDisconnect: () => {
      activationInFlightRef.current = false;
      scheduleIdleReturn();
    },
    onError: (error) => {
      activationInFlightRef.current = false;
      dispatch({
        type: "session-error",
        message: getErrorMessage(error),
      });
    },
    onMessage: createMessageHandler(dispatch),
    onModeChange: ({ mode }) => {
      dispatch({
        type: "agent-mode-changed",
        mode,
      });
    },
    onStatusChange: ({ status }) => {
      if (status === "disconnected" && state.sessionActive) {
        scheduleIdleReturn();
      }
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
    clearIdleTimer();
    dispatch({ type: "activation-requested" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      await conversation.startSession({
        agentId: envResult.config.elevenLabs.agentId,
        connectionType: "webrtc",
      });
    } catch (error) {
      activationInFlightRef.current = false;
      dispatch({
        type: "session-error",
        message: getErrorMessage(error),
      });
    }
  }, [clearIdleTimer, conversation, envResult.config, envResult.error]);

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

  useEffect(() => {
    let frameId = 0;

    const updateLevel = () => {
      const nextLevel =
        state.notchState === "speaking"
          ? conversation.getOutputVolume()
          : conversation.getInputVolume();

      setConversationLevel(nextLevel);
      frameId = window.requestAnimationFrame(updateLevel);
    };

    frameId = window.requestAnimationFrame(updateLevel);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [conversation, state.notchState]);

  useEffect(() => {
    return () => {
      clearIdleTimer();
    };
  }, [clearIdleTimer]);

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
