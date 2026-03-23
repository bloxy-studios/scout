import { describe, expect, it } from "vitest";
import {
  WAVEFORM_BAR_COUNT,
  buildWaveformFrame,
} from "./waveform-motion";

describe("buildWaveformFrame", () => {
  it("keeps the listening waveform alive even when the signal is silent", () => {
    const frame = buildWaveformFrame({
      variant: "listening",
      signal: 0,
      phase: 0.25,
    });

    expect(frame).toHaveLength(WAVEFORM_BAR_COUNT);
    expect(new Set(frame.map((bar) => bar.height)).size).toBeGreaterThan(1);
    expect(frame.every((bar) => bar.palette === "light")).toBe(true);
  });

  it("uses the brand palette for speaking and processing states", () => {
    const speaking = buildWaveformFrame({
      variant: "speaking",
      signal: 0.45,
      phase: 0.5,
    });
    const processing = buildWaveformFrame({
      variant: "processing",
      signal: 0.45,
      phase: 0.5,
    });

    expect(speaking.every((bar) => bar.palette === "brand")).toBe(true);
    expect(processing.every((bar) => bar.palette === "brand")).toBe(true);
  });

  it("keeps speaking more energetic than processing with the same input signal", () => {
    const speaking = buildWaveformFrame({
      variant: "speaking",
      signal: 0.42,
      phase: 0.9,
    });
    const processing = buildWaveformFrame({
      variant: "processing",
      signal: 0.42,
      phase: 0.9,
    });

    const speakingAverage =
      speaking.reduce((total, bar) => total + bar.height, 0) / speaking.length;
    const processingAverage =
      processing.reduce((total, bar) => total + bar.height, 0) / processing.length;

    expect(speakingAverage).toBeGreaterThan(processingAverage);
  });
});
