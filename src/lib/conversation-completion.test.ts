import { describe, expect, it } from "vitest";
import {
  COMPLETION_TIMINGS,
  advanceConversationCompletion,
  clearConversationCloseRequest,
  createConversationCompletionState,
  requestConversationClose,
  shouldReturnToIdle,
  type ConversationCompletionSnapshot,
} from "./conversation-completion";

function createSnapshot(
  overrides: Partial<ConversationCompletionSnapshot> = {},
): ConversationCompletionSnapshot {
  return {
    now: 0,
    inputLevel: 0,
    outputLevel: 0,
    notchState: "listening",
    sessionActive: true,
    status: "connected",
    ...overrides,
  };
}

describe("conversation completion controller", () => {
  it("stays active during a short listening pause after user speech", () => {
    const initial = createConversationCompletionState(0);
    const speakingSample = createSnapshot({
      now: 400,
      inputLevel: 0.42,
    });
    const pausedSample = createSnapshot({
      now: 900,
      inputLevel: 0.01,
    });

    const afterSpeech = advanceConversationCompletion(initial, speakingSample);
    const pausedState = advanceConversationCompletion(afterSpeech, pausedSample);

    expect(shouldReturnToIdle(pausedState, pausedSample)).toBe(false);
  });

  it("returns to idle after an explicit close request and spoken closing finish", () => {
    const initial = createConversationCompletionState(0);
    const closeRequested = requestConversationClose(
      initial,
      COMPLETION_TIMINGS.minActiveMs + 50,
    );
    const speakingSample = createSnapshot({
      now: COMPLETION_TIMINGS.minActiveMs + 300,
      notchState: "speaking",
      outputLevel: 0.35,
    });
    const speechStoppedAt = COMPLETION_TIMINGS.minActiveMs + 800;
    const settleSample = createSnapshot({
      now: speechStoppedAt + COMPLETION_TIMINGS.closeResponseSettleMs + 20,
      notchState: "listening",
      inputLevel: 0,
    });

    const afterSpeaking = advanceConversationCompletion(
      closeRequested,
      speakingSample,
    );
    const afterStop = advanceConversationCompletion(
      afterSpeaking,
      createSnapshot({
        now: speechStoppedAt,
        notchState: "listening",
        inputLevel: 0,
      }),
    );
    const settledState = advanceConversationCompletion(afterStop, settleSample);

    expect(shouldReturnToIdle(settledState, settleSample)).toBe(true);
  });

  it("stays active while waiting for a closing response", () => {
    const initial = createConversationCompletionState(0);
    const closeRequested = requestConversationClose(
      initial,
      COMPLETION_TIMINGS.minActiveMs + 50,
    );
    const waitingSample = createSnapshot({
      now: COMPLETION_TIMINGS.minActiveMs + COMPLETION_TIMINGS.closeNoResponseMs - 50,
      notchState: "listening",
      inputLevel: 0,
    });

    const waitingState = advanceConversationCompletion(closeRequested, waitingSample);

    expect(shouldReturnToIdle(waitingState, waitingSample)).toBe(false);
  });

  it("returns to idle if no closing response starts within the fallback timeout", () => {
    const initial = createConversationCompletionState(0);
    const closeRequested = requestConversationClose(
      initial,
      COMPLETION_TIMINGS.minActiveMs + 50,
    );
    const timeoutSample = createSnapshot({
      now: COMPLETION_TIMINGS.minActiveMs + COMPLETION_TIMINGS.closeNoResponseMs + 50,
      notchState: "listening",
      inputLevel: 0,
    });

    const timeoutState = advanceConversationCompletion(closeRequested, timeoutSample);

    expect(shouldReturnToIdle(timeoutState, timeoutSample)).toBe(true);
  });

  it("does not return to idle while processing or searching", () => {
    const initial = createConversationCompletionState(0);
    const processingSample = createSnapshot({
      now: 4000,
      notchState: "processing",
    });
    const searchingSample = createSnapshot({
      now: 4500,
      notchState: "searching",
    });

    const processingState = advanceConversationCompletion(initial, processingSample);
    const searchingState = advanceConversationCompletion(processingState, searchingSample);

    expect(shouldReturnToIdle(processingState, processingSample)).toBe(false);
    expect(shouldReturnToIdle(searchingState, searchingSample)).toBe(false);
  });

  it("does not treat an ordinary short silence as the end of the conversation", () => {
    const initial = createConversationCompletionState(0);
    const afterSpeech = advanceConversationCompletion(
      initial,
      createSnapshot({
        now: 500,
        inputLevel: 0.42,
      }),
    );
    const quietSample = createSnapshot({
      now: 5_000,
      notchState: "listening",
      inputLevel: 0,
    });

    const quietState = advanceConversationCompletion(afterSpeech, quietSample);

    expect(shouldReturnToIdle(quietState, quietSample)).toBe(false);
  });

  it("can clear a pending close request when the user continues with a new request", () => {
    const initial = createConversationCompletionState(0);
    const closeRequested = requestConversationClose(
      initial,
      COMPLETION_TIMINGS.minActiveMs + 50,
    );
    const cleared = clearConversationCloseRequest(closeRequested);
    const followUpSample = createSnapshot({
      now: COMPLETION_TIMINGS.minActiveMs + COMPLETION_TIMINGS.closeNoResponseMs + 50,
      notchState: "listening",
      inputLevel: 0,
    });

    const advanced = advanceConversationCompletion(cleared, followUpSample);

    expect(shouldReturnToIdle(advanced, followUpSample)).toBe(false);
  });

  it("returns to idle after a disconnected quiet period", () => {
    const initial = createConversationCompletionState(0);
    const disconnectedSample = createSnapshot({
      now: COMPLETION_TIMINGS.minActiveMs + COMPLETION_TIMINGS.disconnectGraceMs + 100,
      status: "disconnected",
      inputLevel: 0,
      outputLevel: 0,
      notchState: "listening",
    });

    const advanced = advanceConversationCompletion(initial, disconnectedSample);

    expect(shouldReturnToIdle(advanced, disconnectedSample)).toBe(true);
  });
});
