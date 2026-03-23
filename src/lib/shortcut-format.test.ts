import { describe, expect, it } from "vitest";
import {
  EMPTY_SHORTCUT_LABEL,
  formatShortcutDisplay,
  getShortcutValidationError,
  isValidShortcutCandidate,
  MISSING_MODIFIER_MESSAGE,
  normalizeShortcutCandidate,
  RESERVED_SHORTCUT_MESSAGE,
  TOO_MANY_KEYS_MESSAGE,
  type ShortcutCandidate,
} from "./shortcut-format";

describe("shortcut-format", () => {
  it("formats macOS modifiers into display glyphs", () => {
    expect(formatShortcutDisplay("Alt+Shift+Space")).toBe("\u2325\u21e7Space");
    expect(formatShortcutDisplay("CommandOrControl+K")).toBe("\u2318K");
    expect(formatShortcutDisplay("Super+Shift+Digit7")).toBe("\u2318\u21e77");
  });

  it("shows a friendly label for empty bindings", () => {
    expect(formatShortcutDisplay("")).toBe(EMPTY_SHORTCUT_LABEL);
    expect(formatShortcutDisplay(undefined)).toBe(EMPTY_SHORTCUT_LABEL);
  });

  it("normalizes a captured candidate separately from its display label", () => {
    const candidate: ShortcutCandidate = {
      modifiers: ["Alt", "Shift"],
      key: "Space",
    };

    expect(normalizeShortcutCandidate(candidate)).toBe("Alt+Shift+Space");
    expect(formatShortcutDisplay(normalizeShortcutCandidate(candidate))).toBe(
      "\u2325\u21e7Space",
    );
  });

  it("requires at least one modifier for a valid candidate", () => {
    const candidate: ShortcutCandidate = {
      modifiers: [],
      key: "K",
    };

    expect(isValidShortcutCandidate(candidate)).toBe(false);
    expect(getShortcutValidationError(candidate)).toBe(
      MISSING_MODIFIER_MESSAGE,
    );

    expect(
      isValidShortcutCandidate({
        modifiers: ["Alt"],
        key: "K",
      }),
    ).toBe(true);
  });

  it("rejects candidates with more than three total keys", () => {
    expect(
      getShortcutValidationError({
        modifiers: ["CommandOrControl", "Alt", "Shift"],
        key: "K",
      }),
    ).toBe(TOO_MANY_KEYS_MESSAGE);
  });

  it("rejects reserved macOS shortcuts", () => {
    expect(
      getShortcutValidationError({
        modifiers: ["CommandOrControl"],
        key: "Space",
      }),
    ).toBe(RESERVED_SHORTCUT_MESSAGE);
  });
});
