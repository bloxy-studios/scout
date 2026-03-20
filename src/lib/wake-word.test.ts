import { describe, expect, it } from "vitest";
import { shouldTriggerWakeWord } from "./wake-word";

describe("shouldTriggerWakeWord", () => {
  it("allows activation when Scout is idle and outside the cooldown window", () => {
    expect(
      shouldTriggerWakeWord({
        isSessionActive: false,
        lastDetectedAt: 1_000,
        now: 8_000,
        cooldownMs: 5_000,
      }),
    ).toBe(true);
  });

  it("blocks activation while a session is active", () => {
    expect(
      shouldTriggerWakeWord({
        isSessionActive: true,
        lastDetectedAt: 1_000,
        now: 8_000,
        cooldownMs: 5_000,
      }),
    ).toBe(false);
  });

  it("blocks activation while the cooldown is still active", () => {
    expect(
      shouldTriggerWakeWord({
        isSessionActive: false,
        lastDetectedAt: 5_000,
        now: 8_000,
        cooldownMs: 5_000,
      }),
    ).toBe(false);
  });
});
