import { describe, expect, it } from "vitest";
import { detectCloseIntent, extractTranscriptText } from "./close-intent";

describe("detectCloseIntent", () => {
  it("recognizes clear ending phrases", () => {
    expect(detectCloseIntent("That's all")).toBe(true);
    expect(detectCloseIntent("thank you, that's all")).toBe(true);
    expect(detectCloseIntent("I'm done")).toBe(true);
    expect(detectCloseIntent("goodbye")).toBe(true);
  });

  it("avoids common false positives and continuations", () => {
    expect(detectCloseIntent("that's it?")).toBe(false);
    expect(
      detectCloseIntent("I'm done with that part, now help me with billing"),
    ).toBe(false);
    expect(
      detectCloseIntent("that's all the context, here's the real question"),
    ).toBe(false);
    expect(detectCloseIntent("okay bye but one more thing")).toBe(false);
  });
});

describe("extractTranscriptText", () => {
  it("extracts text from common message payload shapes", () => {
    expect(extractTranscriptText({ message: "that's all" })).toBe("that's all");
    expect(extractTranscriptText({ message: { text: "i'm done" } })).toBe(
      "i'm done",
    );
    expect(extractTranscriptText({ text: "goodbye" })).toBe("goodbye");
  });

  it("returns an empty string for unknown payloads", () => {
    expect(extractTranscriptText({ foo: "bar" })).toBe("");
    expect(extractTranscriptText(null)).toBe("");
  });
});
