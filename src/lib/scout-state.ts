export type NotchState =
  | "idle"
  | "listening"
  | "processing"
  | "searching"
  | "speaking"
  | "error";

export type ScoutSessionError = {
  message: string;
};

export type ScoutState = {
  notchState: NotchState;
  sessionActive: boolean;
  errorMessage: string | null;
};

export type ScoutEvent =
  | { type: "activation-requested" }
  | { type: "user-transcript-received" }
  | { type: "search-started" }
  | { type: "agent-mode-changed"; mode: "listening" | "speaking" }
  | { type: "session-error"; message: ScoutSessionError["message"] }
  | { type: "session-ended" };

export function createInitialScoutState(errorMessage?: string): ScoutState {
  if (errorMessage) {
    return {
      notchState: "error",
      sessionActive: false,
      errorMessage,
    };
  }

  return {
    notchState: "idle",
    sessionActive: false,
    errorMessage: null,
  };
}

export function reduceScoutState(
  state: ScoutState,
  event: ScoutEvent,
): ScoutState {
  switch (event.type) {
    case "activation-requested":
      return {
        notchState: "listening",
        sessionActive: true,
        errorMessage: null,
      };
    case "user-transcript-received":
      return {
        ...state,
        notchState: "processing",
      };
    case "search-started":
      return {
        ...state,
        notchState: "searching",
      };
    case "agent-mode-changed":
      return {
        ...state,
        notchState: event.mode === "speaking" ? "speaking" : "listening",
      };
    case "session-error":
      return {
        notchState: "error",
        sessionActive: false,
        errorMessage: event.message,
      };
    case "session-ended":
      return createInitialScoutState();
    default:
      return state;
  }
}
