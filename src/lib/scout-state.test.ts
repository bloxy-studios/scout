import { describe, expect, it } from "vitest";
import { createInitialScoutState, reduceScoutState } from "./scout-state";

describe("reduceScoutState", () => {
  it("moves from idle to listening when activation is requested", () => {
    const nextState = reduceScoutState(createInitialScoutState(), {
      type: "activation-requested",
    });

    expect(nextState.notchState).toBe("listening");
    expect(nextState.sessionActive).toBe(true);
  });

  it("shows processing, searching, and speaking in order", () => {
    const activeState = reduceScoutState(createInitialScoutState(), {
      type: "activation-requested",
    });

    const processingState = reduceScoutState(activeState, {
      type: "user-transcript-received",
    });
    const searchingState = reduceScoutState(processingState, {
      type: "search-started",
    });
    const speakingState = reduceScoutState(searchingState, {
      type: "agent-mode-changed",
      mode: "speaking",
    });

    expect(processingState.notchState).toBe("processing");
    expect(searchingState.notchState).toBe("searching");
    expect(speakingState.notchState).toBe("speaking");
  });

  it("captures an error and returns to idle when the session ends", () => {
    const activeState = reduceScoutState(createInitialScoutState(), {
      type: "activation-requested",
    });

    const errorState = reduceScoutState(activeState, {
      type: "session-error",
      message: "Microphone permission denied",
    });
    const idleState = reduceScoutState(errorState, {
      type: "session-ended",
    });

    expect(errorState.notchState).toBe("error");
    expect(errorState.errorMessage).toContain("Microphone");
    expect(idleState.notchState).toBe("idle");
    expect(idleState.sessionActive).toBe(false);
  });

  it("ignores late mode changes after the session has already ended", () => {
    const idleState = reduceScoutState(createInitialScoutState(), {
      type: "session-ended",
    });

    const nextState = reduceScoutState(idleState, {
      type: "agent-mode-changed",
      mode: "speaking",
    });

    expect(nextState.notchState).toBe("idle");
    expect(nextState.sessionActive).toBe(false);
  });
});
