import type { NotchState } from "./scout-state";

export type ConversationConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error"
  | "transcribing";

export type ConversationCompletionSnapshot = {
  now: number;
  inputLevel: number;
  outputLevel: number;
  notchState: NotchState;
  sessionActive: boolean;
  status: ConversationConnectionStatus;
};

export type ConversationCompletionState = {
  activatedAt: number;
  lastActivityAt: number;
  lastUserSpeechAt: number | null;
  lastAgentSpeechAt: number | null;
  followUpUntil: number | null;
  closeRequestedAt: number | null;
  closeResponseStartedAt: number | null;
  wasUserSpeaking: boolean;
  wasAgentSpeaking: boolean;
};

export const COMPLETION_TIMINGS = {
  minActiveMs: 1_200,
  followUpGraceMs: 1_800,
  disconnectGraceMs: 400,
  closeNoResponseMs: 2_400,
  closeResponseSettleMs: 250,
  staleSessionMs: 18_000,
} as const;

const INPUT_SPEECH_THRESHOLD = 0.08;
const OUTPUT_SPEECH_THRESHOLD = 0.06;

function isUserSpeaking(snapshot: ConversationCompletionSnapshot): boolean {
  return (
    snapshot.notchState === "listening" &&
    snapshot.inputLevel >= INPUT_SPEECH_THRESHOLD
  );
}

function isAgentSpeaking(snapshot: ConversationCompletionSnapshot): boolean {
  return (
    snapshot.notchState === "speaking" &&
    snapshot.outputLevel >= OUTPUT_SPEECH_THRESHOLD
  );
}

function isAgentBusy(notchState: NotchState): boolean {
  return notchState === "processing" || notchState === "searching";
}

export function createConversationCompletionState(
  now: number,
): ConversationCompletionState {
  return {
    activatedAt: now,
    lastActivityAt: now,
    lastUserSpeechAt: null,
    lastAgentSpeechAt: null,
    followUpUntil: null,
    closeRequestedAt: null,
    closeResponseStartedAt: null,
    wasUserSpeaking: false,
    wasAgentSpeaking: false,
  };
}

export function requestConversationClose(
  state: ConversationCompletionState,
  now: number,
): ConversationCompletionState {
  if (state.closeRequestedAt) {
    return state;
  }

  return {
    ...state,
    closeRequestedAt: now,
    closeResponseStartedAt: null,
    followUpUntil: null,
  };
}

export function clearConversationCloseRequest(
  state: ConversationCompletionState,
): ConversationCompletionState {
  return {
    ...state,
    closeRequestedAt: null,
    closeResponseStartedAt: null,
  };
}

export function advanceConversationCompletion(
  state: ConversationCompletionState,
  snapshot: ConversationCompletionSnapshot,
): ConversationCompletionState {
  const userSpeaking = isUserSpeaking(snapshot);
  const agentSpeaking = isAgentSpeaking(snapshot);
  const busy = isAgentBusy(snapshot.notchState);
  const hadActivity =
    userSpeaking ||
    agentSpeaking ||
    busy ||
    snapshot.status === "connecting" ||
    snapshot.status === "transcribing";

  let followUpUntil = state.followUpUntil;
  let closeResponseStartedAt = state.closeResponseStartedAt;

  if (state.wasAgentSpeaking && !agentSpeaking) {
    followUpUntil = snapshot.now + COMPLETION_TIMINGS.followUpGraceMs;
  }

  if (
    state.closeRequestedAt &&
    closeResponseStartedAt == null &&
    !state.wasAgentSpeaking &&
    agentSpeaking
  ) {
    closeResponseStartedAt = snapshot.now;
  }

  if (userSpeaking || agentSpeaking || busy) {
    followUpUntil = null;
  }

  return {
    activatedAt: state.activatedAt,
    lastActivityAt: hadActivity ? snapshot.now : state.lastActivityAt,
    lastUserSpeechAt: userSpeaking ? snapshot.now : state.lastUserSpeechAt,
    lastAgentSpeechAt: agentSpeaking ? snapshot.now : state.lastAgentSpeechAt,
    followUpUntil,
    closeRequestedAt: state.closeRequestedAt,
    closeResponseStartedAt,
    wasUserSpeaking: userSpeaking,
    wasAgentSpeaking: agentSpeaking,
  };
}

export function shouldReturnToIdle(
  state: ConversationCompletionState,
  snapshot: ConversationCompletionSnapshot,
): boolean {
  if (!snapshot.sessionActive) {
    return false;
  }

  if (snapshot.notchState === "error" || snapshot.status === "error") {
    return false;
  }

  if (snapshot.now - state.activatedAt < COMPLETION_TIMINGS.minActiveMs) {
    return false;
  }

  if (state.wasUserSpeaking || state.wasAgentSpeaking) {
    return false;
  }

  if (snapshot.status === "connecting" || snapshot.status === "transcribing") {
    return false;
  }

  if (snapshot.status === "disconnected") {
    return (
      snapshot.now - state.lastActivityAt >= COMPLETION_TIMINGS.disconnectGraceMs
    );
  }

  if (isAgentBusy(snapshot.notchState)) {
    return false;
  }

  if (state.closeRequestedAt) {
    if (state.closeResponseStartedAt) {
      const closeResponseSettledAt =
        state.lastAgentSpeechAt ?? state.closeResponseStartedAt;

      return (
        snapshot.now - closeResponseSettledAt >=
        COMPLETION_TIMINGS.closeResponseSettleMs
      );
    }

    return (
      snapshot.now - state.closeRequestedAt >=
      COMPLETION_TIMINGS.closeNoResponseMs
    );
  }

  if (state.followUpUntil && snapshot.now < state.followUpUntil) {
    return false;
  }

  return (
    snapshot.now - state.lastActivityAt >= COMPLETION_TIMINGS.staleSessionMs
  );
}
